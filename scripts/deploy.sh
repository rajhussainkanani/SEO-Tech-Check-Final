#!/bin/bash

# SEO Tech Check - AWS ECS Deployment Script
# This script deploys the application to Amazon ECS

set -e

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID}
CLUSTER_NAME=${CLUSTER_NAME:-seo-tech-check-cluster}
SERVICE_PREFIX=${SERVICE_PREFIX:-seo-tech-check}
ECR_REPOSITORY_PREFIX=${ECR_REPOSITORY_PREFIX:-seo-tech-check}
IMAGE_TAG=${IMAGE_TAG:-latest}
VPC_ID=${VPC_ID}
SUBNET_IDS=${SUBNET_IDS}
SECURITY_GROUP_ID=${SECURITY_GROUP_ID}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_error "jq is not installed. Please install it first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to validate AWS credentials and get account ID
validate_aws_credentials() {
    print_status "Validating AWS credentials..."
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials are not configured or invalid."
        exit 1
    fi
    
    if [ -z "$AWS_ACCOUNT_ID" ]; then
        AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
        print_status "Detected AWS Account ID: $AWS_ACCOUNT_ID"
    fi
    
    print_success "AWS credentials validated"
}

# Function to create ECS cluster
create_ecs_cluster() {
    print_status "Creating ECS cluster: $CLUSTER_NAME"
    
    if aws ecs describe-clusters --clusters "$CLUSTER_NAME" --region "$AWS_REGION" &> /dev/null; then
        print_status "ECS cluster already exists: $CLUSTER_NAME"
    else
        aws ecs create-cluster \
            --cluster-name "$CLUSTER_NAME" \
            --capacity-providers FARGATE \
            --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
            --region "$AWS_REGION"
        print_success "ECS cluster created: $CLUSTER_NAME"
    fi
}

# Function to create IAM roles
create_iam_roles() {
    print_status "Creating IAM roles..."
    
    # ECS Task Execution Role
    local execution_role_name="${SERVICE_PREFIX}-execution-role"
    local task_role_name="${SERVICE_PREFIX}-task-role"
    
    # Create execution role
    if ! aws iam get-role --role-name "$execution_role_name" &> /dev/null; then
        print_status "Creating ECS task execution role..."
        
        cat > /tmp/trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
        
        aws iam create-role \
            --role-name "$execution_role_name" \
            --assume-role-policy-document file:///tmp/trust-policy.json
        
        aws iam attach-role-policy \
            --role-name "$execution_role_name" \
            --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
        
        print_success "ECS task execution role created"
    else
        print_status "ECS task execution role already exists"
    fi
    
    # Create task role
    if ! aws iam get-role --role-name "$task_role_name" &> /dev/null; then
        print_status "Creating ECS task role..."
        
        aws iam create-role \
            --role-name "$task_role_name" \
            --assume-role-policy-document file:///tmp/trust-policy.json
        
        print_success "ECS task role created"
    else
        print_status "ECS task role already exists"
    fi
    
    rm -f /tmp/trust-policy.json
}

# Function to create task definitions
create_task_definitions() {
    print_status "Creating ECS task definitions..."
    
    local execution_role_arn="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${SERVICE_PREFIX}-execution-role"
    local task_role_arn="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${SERVICE_PREFIX}-task-role"
    local backend_image="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY_PREFIX}-backend:${IMAGE_TAG}"
    local frontend_image="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY_PREFIX}-frontend:${IMAGE_TAG}"
    
    # Backend task definition
    cat > /tmp/backend-task-def.json << EOF
{
  "family": "${SERVICE_PREFIX}-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "${execution_role_arn}",
  "taskRoleArn": "${task_role_arn}",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "${backend_image}",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3001"
        },
        {
          "name": "SCRAPE_DO_API_KEY",
          "value": "ef8324bc40db40949fd2819c8338c2ea0d9573d2940"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/${SERVICE_PREFIX}-backend",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
EOF
    
    # Frontend task definition
    cat > /tmp/frontend-task-def.json << EOF
{
  "family": "${SERVICE_PREFIX}-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "${execution_role_arn}",
  "taskRoleArn": "${task_role_arn}",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "${frontend_image}",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "REACT_APP_API_URL",
          "value": "http://backend.local:3001/api"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/${SERVICE_PREFIX}-frontend",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
EOF
    
    # Register task definitions
    aws ecs register-task-definition \
        --cli-input-json file:///tmp/backend-task-def.json \
        --region "$AWS_REGION"
    
    aws ecs register-task-definition \
        --cli-input-json file:///tmp/frontend-task-def.json \
        --region "$AWS_REGION"
    
    print_success "Task definitions created"
    
    # Clean up
    rm -f /tmp/backend-task-def.json /tmp/frontend-task-def.json
}

# Function to create CloudWatch log groups
create_log_groups() {
    print_status "Creating CloudWatch log groups..."
    
    local log_groups=("/ecs/${SERVICE_PREFIX}-backend" "/ecs/${SERVICE_PREFIX}-frontend")
    
    for log_group in "${log_groups[@]}"; do
        if ! aws logs describe-log-groups --log-group-name-prefix "$log_group" --region "$AWS_REGION" | grep -q "$log_group"; then
            aws logs create-log-group \
                --log-group-name "$log_group" \
                --region "$AWS_REGION"
            
            aws logs put-retention-policy \
                --log-group-name "$log_group" \
                --retention-in-days 30 \
                --region "$AWS_REGION"
            
            print_success "Created log group: $log_group"
        else
            print_status "Log group already exists: $log_group"
        fi
    done
}

# Function to create ECS services
create_ecs_services() {
    print_status "Creating ECS services..."
    
    # Backend service
    if ! aws ecs describe-services --cluster "$CLUSTER_NAME" --services "${SERVICE_PREFIX}-backend" --region "$AWS_REGION" | grep -q "ACTIVE"; then
        print_status "Creating backend service..."
        
        aws ecs create-service \
            --cluster "$CLUSTER_NAME" \
            --service-name "${SERVICE_PREFIX}-backend" \
            --task-definition "${SERVICE_PREFIX}-backend" \
            --desired-count 1 \
            --launch-type FARGATE \
            --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_IDS}],securityGroups=[${SECURITY_GROUP_ID}],assignPublicIp=ENABLED}" \
            --region "$AWS_REGION"
        
        print_success "Backend service created"
    else
        print_status "Backend service already exists, updating..."
        aws ecs update-service \
            --cluster "$CLUSTER_NAME" \
            --service "${SERVICE_PREFIX}-backend" \
            --task-definition "${SERVICE_PREFIX}-backend" \
            --region "$AWS_REGION"
    fi
    
    # Frontend service
    if ! aws ecs describe-services --cluster "$CLUSTER_NAME" --services "${SERVICE_PREFIX}-frontend" --region "$AWS_REGION" | grep -q "ACTIVE"; then
        print_status "Creating frontend service..."
        
        aws ecs create-service \
            --cluster "$CLUSTER_NAME" \
            --service-name "${SERVICE_PREFIX}-frontend" \
            --task-definition "${SERVICE_PREFIX}-frontend" \
            --desired-count 1 \
            --launch-type FARGATE \
            --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_IDS}],securityGroups=[${SECURITY_GROUP_ID}],assignPublicIp=ENABLED}" \
            --region "$AWS_REGION"
        
        print_success "Frontend service created"
    else
        print_status "Frontend service already exists, updating..."
        aws ecs update-service \
            --cluster "$CLUSTER_NAME" \
            --service "${SERVICE_PREFIX}-frontend" \
            --task-definition "${SERVICE_PREFIX}-frontend" \
            --region "$AWS_REGION"
    fi
}

# Function to wait for services to be stable
wait_for_services() {
    print_status "Waiting for services to be stable..."
    
    aws ecs wait services-stable \
        --cluster "$CLUSTER_NAME" \
        --services "${SERVICE_PREFIX}-backend" "${SERVICE_PREFIX}-frontend" \
        --region "$AWS_REGION"
    
    print_success "Services are stable"
}

# Function to validate deployment
validate_deployment() {
    print_status "Validating deployment..."
    
    # Check service status
    local backend_status=$(aws ecs describe-services \
        --cluster "$CLUSTER_NAME" \
        --services "${SERVICE_PREFIX}-backend" \
        --region "$AWS_REGION" \
        --query 'services[0].status' \
        --output text)
    
    local frontend_status=$(aws ecs describe-services \
        --cluster "$CLUSTER_NAME" \
        --services "${SERVICE_PREFIX}-frontend" \
        --region "$AWS_REGION" \
        --query 'services[0].status' \
        --output text)
    
    if [[ "$backend_status" != "ACTIVE" || "$frontend_status" != "ACTIVE" ]]; then
        print_error "Service deployment failed. Backend: $backend_status, Frontend: $frontend_status"
        return 1
    fi
    
    # Check task health
    local backend_health=$(aws ecs describe-tasks \
        --cluster "$CLUSTER_NAME" \
        --tasks $(aws ecs list-tasks \
            --cluster "$CLUSTER_NAME" \
            --service-name "${SERVICE_PREFIX}-backend" \
            --desired-status RUNNING \
            --query 'taskArns[0]' \
            --output text) \
        --query 'tasks[0].healthStatus' \
        --output text)
    
    if [[ "$backend_health" != "HEALTHY" ]]; then
        print_error "Backend tasks are not healthy: $backend_health"
        return 1
    fi
    
    # Check target group health
    local backend_target_health=$(aws elbv2 describe-target-health \
        --target-group-arn $(aws elbv2 describe-target-groups \
            --names "${SERVICE_PREFIX}-be-tg" \
            --query 'TargetGroups[0].TargetGroupArn' \
            --output text) \
        --query 'TargetHealthDescriptions[0].TargetHealth.State' \
        --output text)
    
    if [[ "$backend_target_health" != "healthy" ]]; then
        print_error "Backend target group is not healthy: $backend_target_health"
        return 1
    fi
    
    print_success "Deployment validation passed"
    return 0
}

# Function to perform rollback
perform_rollback() {
    print_warning "Initiating rollback procedure..."
    
    # Roll back to previous task definition
    local previous_backend_td=$(aws ecs describe-task-definition \
        --task-definition "${SERVICE_PREFIX}-backend" \
        --query 'taskDefinition.taskDefinitionArn' \
        --output text)
    
    aws ecs update-service \
        --cluster "$CLUSTER_NAME" \
        --service "${SERVICE_PREFIX}-backend" \
        --task-definition "$previous_backend_td" \
        --region "$AWS_REGION"
    
    print_status "Waiting for rollback to complete..."
    aws ecs wait services-stable \
        --cluster "$CLUSTER_NAME" \
        --services "${SERVICE_PREFIX}-backend" \
        --region "$AWS_REGION"
    
    print_warning "Rollback completed"
}

# Function to display deployment information
display_deployment_info() {
    print_success "Deployment completed successfully!"
    echo ""
    print_status "Deployment Information:"
    echo "Cluster: $CLUSTER_NAME"
    echo "Region: $AWS_REGION"
    echo "Backend Service: ${SERVICE_PREFIX}-backend"
    echo "Frontend Service: ${SERVICE_PREFIX}-frontend"
    echo ""
    print_status "Service Health:"
    aws ecs describe-services \
        --cluster "$CLUSTER_NAME" \
        --services "${SERVICE_PREFIX}-backend" "${SERVICE_PREFIX}-frontend" \
        --query 'services[*].[serviceName,status,runningCount,desiredCount]' \
        --output table \
        --region "$AWS_REGION"
    
    echo ""
    print_status "Target Group Health:"
    aws elbv2 describe-target-health \
        --target-group-arn $(aws elbv2 describe-target-groups \
            --names "${SERVICE_PREFIX}-be-tg" \
            --query 'TargetGroups[0].TargetGroupArn' \
            --output text) \
        --query 'TargetHealthDescriptions[*].[Target.Id,TargetHealth.State]' \
        --output table
}

# Main execution
main() {
    echo "=========================================="
    echo "SEO Tech Check - AWS ECS Deployment"
    echo "=========================================="
    echo ""
    
    # Validate required environment variables
    if [ -z "$VPC_ID" ] || [ -z "$SUBNET_IDS" ] || [ -z "$SECURITY_GROUP_ID" ]; then
        print_error "Required environment variables are missing:"
        print_error "VPC_ID, SUBNET_IDS, and SECURITY_GROUP_ID must be set"
        exit 1
    fi
    
    # Store current task definition for potential rollback
    local current_backend_td=$(aws ecs describe-services \
        --cluster "$CLUSTER_NAME" \
        --services "${SERVICE_PREFIX}-backend" \
        --query 'services[0].taskDefinition' \
        --output text \
        --region "$AWS_REGION" || echo "")
    
    # Deploy
    check_prerequisites
    validate_aws_credentials
    create_ecs_cluster
    create_iam_roles
    create_log_groups
    create_task_definitions
    create_ecs_services
    wait_for_services
    
    # Validate deployment
    if ! validate_deployment; then
        print_error "Deployment validation failed"
        if [ ! -z "$current_backend_td" ]; then
            perform_rollback
        fi
        exit 1
    fi
    
    display_deployment_info
}

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Deploy SEO Tech Check to Amazon ECS"
    echo ""
    echo "Required Environment Variables:"
    echo "  VPC_ID                  VPC ID for ECS services"
    echo "  SUBNET_IDS              Comma-separated subnet IDs"
    echo "  SECURITY_GROUP_ID       Security group ID"
    echo ""
    echo "Optional Environment Variables:"
    echo "  AWS_REGION              AWS region (default: us-east-1)"
    echo "  AWS_ACCOUNT_ID          AWS account ID (auto-detected if not set)"
    echo "  CLUSTER_NAME            ECS cluster name (default: seo-tech-check-cluster)"
    echo "  SERVICE_PREFIX          Service name prefix (default: seo-tech-check)"
    echo "  ECR_REPOSITORY_PREFIX   ECR repository prefix (default: seo-tech-check)"
    echo "  IMAGE_TAG               Docker image tag (default: latest)"
    echo ""
    echo "Examples:"
    echo "  VPC_ID=vpc-12345 SUBNET_IDS=subnet-123,subnet-456 SECURITY_GROUP_ID=sg-789 $0"
    echo ""
}

# Check for help flag
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

# Run main function
main "$@"
