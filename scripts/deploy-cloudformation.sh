#!/bin/bash

# SEO Tech Check - CloudFormation Stack Deployment Script
# This script deploys the CloudFormation infrastructure stack

set -e

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME=${PROJECT_NAME:-seo-tech-check}
ENVIRONMENT=${ENVIRONMENT:-production}
STACK_NAME="${PROJECT_NAME}-${ENVIRONMENT}-stack"

# Docker image URIs (these should be set to your ECR repositories)
BACKEND_IMAGE_URI=${BACKEND_IMAGE_URI:-"198023436521.dkr.ecr.us-east-1.amazonaws.com/seo-tech-check-backend:latest"}
FRONTEND_IMAGE_URI=${FRONTEND_IMAGE_URI:-"198023436521.dkr.ecr.us-east-1.amazonaws.com/seo-tech-check-frontend:latest"}
SCRAPE_DO_API_KEY=${SCRAPE_DO_API_KEY:-"ef8324bc40db40949fd2819c8338c2ea0d9573d2940"}

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
    
    print_success "Prerequisites check passed"
}

# Function to validate AWS credentials
validate_aws_credentials() {
    print_status "Validating AWS credentials..."
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials are not configured or invalid."
        exit 1
    fi
    
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    print_status "Using AWS Account ID: $account_id"
    
    print_success "AWS credentials validated"
}

# Function to validate CloudFormation template
validate_template() {
    print_status "Validating CloudFormation template..."
    
    if aws cloudformation validate-template \
        --template-body file://cloudformation/ecs-stack.yml \
        --region "$AWS_REGION" > /dev/null; then
        print_success "CloudFormation template is valid"
    else
        print_error "CloudFormation template validation failed"
        exit 1
    fi
}

# Function to check if stack exists
stack_exists() {
    aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --query 'Stacks[0].StackStatus' \
        --output text 2>/dev/null || echo "DOES_NOT_EXIST"
}

# Function to deploy CloudFormation stack
deploy_stack() {
    local stack_status=$(stack_exists)
    
    if [ "$stack_status" = "DOES_NOT_EXIST" ]; then
        print_status "Creating new CloudFormation stack: $STACK_NAME"
        
        aws cloudformation create-stack \
            --stack-name "$STACK_NAME" \
            --template-body file://cloudformation/ecs-stack.yml \
            --parameters \
                ParameterKey=ProjectName,ParameterValue="$PROJECT_NAME" \
                ParameterKey=Environment,ParameterValue="$ENVIRONMENT" \
                ParameterKey=BackendImageURI,ParameterValue="$BACKEND_IMAGE_URI" \
                ParameterKey=FrontendImageURI,ParameterValue="$FRONTEND_IMAGE_URI" \
                ParameterKey=ScrapeDoApiKey,ParameterValue="$SCRAPE_DO_API_KEY" \
            --capabilities CAPABILITY_NAMED_IAM \
            --region "$AWS_REGION"
        
        print_status "Waiting for stack creation to complete..."
        aws cloudformation wait stack-create-complete \
            --stack-name "$STACK_NAME" \
            --region "$AWS_REGION"
        
        print_success "Stack created successfully"
    else
        print_status "Updating existing CloudFormation stack: $STACK_NAME"
        print_status "Current stack status: $stack_status"
        
        aws cloudformation update-stack \
            --stack-name "$STACK_NAME" \
            --template-body file://cloudformation/ecs-stack.yml \
            --parameters \
                ParameterKey=ProjectName,ParameterValue="$PROJECT_NAME" \
                ParameterKey=Environment,ParameterValue="$ENVIRONMENT" \
                ParameterKey=BackendImageURI,ParameterValue="$BACKEND_IMAGE_URI" \
                ParameterKey=FrontendImageURI,ParameterValue="$FRONTEND_IMAGE_URI" \
                ParameterKey=ScrapeDoApiKey,ParameterValue="$SCRAPE_DO_API_KEY" \
            --capabilities CAPABILITY_NAMED_IAM \
            --region "$AWS_REGION" || {
                if [[ $? -eq 255 ]]; then
                    print_warning "No updates to be performed on the stack"
                    return 0
                else
                    print_error "Stack update failed"
                    exit 1
                fi
            }
        
        print_status "Waiting for stack update to complete..."
        aws cloudformation wait stack-update-complete \
            --stack-name "$STACK_NAME" \
            --region "$AWS_REGION"
        
        print_success "Stack updated successfully"
    fi
}

# Function to display stack outputs
display_stack_outputs() {
    print_status "Retrieving stack outputs..."
    
    local outputs=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --query 'Stacks[0].Outputs' \
        --output table)
    
    if [ ! -z "$outputs" ]; then
        echo ""
        print_success "Stack Outputs:"
        echo "$outputs"
    fi
    
    # Get Load Balancer URL specifically
    local lb_url=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
        --output text)
    
    if [ ! -z "$lb_url" ]; then
        echo ""
        print_success "Application URL: $lb_url"
        print_status "You can access your application at the above URL once the services are healthy"
    fi
}

# Function to check deployment status
check_deployment_status() {
    print_status "Checking ECS services status..."
    
    local cluster_name="${PROJECT_NAME}-${ENVIRONMENT}-cluster"
    local backend_service="${PROJECT_NAME}-${ENVIRONMENT}-backend"
    local frontend_service="${PROJECT_NAME}-${ENVIRONMENT}-frontend"
    
    # Check if services exist and are running
    local backend_status=$(aws ecs describe-services \
        --cluster "$cluster_name" \
        --services "$backend_service" \
        --region "$AWS_REGION" \
        --query 'services[0].status' \
        --output text 2>/dev/null || echo "NOT_FOUND")
    
    local frontend_status=$(aws ecs describe-services \
        --cluster "$cluster_name" \
        --services "$frontend_service" \
        --region "$AWS_REGION" \
        --query 'services[0].status' \
        --output text 2>/dev/null || echo "NOT_FOUND")
    
    echo ""
    print_status "Service Status:"
    echo "Backend Service: $backend_status"
    echo "Frontend Service: $frontend_status"
    
    if [[ "$backend_status" == "ACTIVE" && "$frontend_status" == "ACTIVE" ]]; then
        print_success "All services are active"
    else
        print_warning "Some services may still be starting up. Check the ECS console for detailed status."
    fi
}

# Main execution
main() {
    echo "=================================================="
    echo "SEO Tech Check - CloudFormation Stack Deployment"
    echo "=================================================="
    echo ""
    echo "Stack Name: $STACK_NAME"
    echo "Region: $AWS_REGION"
    echo "Project: $PROJECT_NAME"
    echo "Environment: $ENVIRONMENT"
    echo ""
    
    check_prerequisites
    validate_aws_credentials
    validate_template
    deploy_stack
    display_stack_outputs
    check_deployment_status
    
    echo ""
    print_success "Deployment completed!"
    print_status "Monitor your deployment in the AWS Console:"
    echo "- CloudFormation: https://console.aws.amazon.com/cloudformation/home?region=$AWS_REGION"
    echo "- ECS: https://console.aws.amazon.com/ecs/home?region=$AWS_REGION"
    echo "- Load Balancer: https://console.aws.amazon.com/ec2/v2/home?region=$AWS_REGION#LoadBalancers:"
}

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Deploy SEO Tech Check CloudFormation stack to AWS"
    echo ""
    echo "Environment Variables:"
    echo "  AWS_REGION              AWS region (default: us-east-1)"
    echo "  PROJECT_NAME            Project name (default: seo-tech-check)"
    echo "  ENVIRONMENT             Environment (default: production)"
    echo "  BACKEND_IMAGE_URI       Backend Docker image URI"
    echo "  FRONTEND_IMAGE_URI      Frontend Docker image URI"
    echo "  SCRAPE_DO_API_KEY       Scrape.do API key"
    echo ""
    echo "Examples:"
    echo "  $0"
    echo "  ENVIRONMENT=staging $0"
    echo ""
}

# Check for help flag
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

# Run main function
main "$@"
