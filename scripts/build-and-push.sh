#!/bin/bash

# SEO Tech Check - Build and Push Docker Images to ECR
# This script builds Docker images and pushes them to Amazon ECR

set -e

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID}
ECR_REPOSITORY_PREFIX=${ECR_REPOSITORY_PREFIX:-seo-tech-check}
IMAGE_TAG=${IMAGE_TAG:-latest}

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

# Function to check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to validate AWS credentials
validate_aws_credentials() {
    print_status "Validating AWS credentials..."
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials are not configured or invalid."
        print_error "Please run 'aws configure' or set AWS environment variables."
        exit 1
    fi
    
    if [ -z "$AWS_ACCOUNT_ID" ]; then
        AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
        print_status "Detected AWS Account ID: $AWS_ACCOUNT_ID"
    fi
    
    print_success "AWS credentials validated"
}

# Function to create ECR repositories if they don't exist
create_ecr_repositories() {
    print_status "Creating ECR repositories if they don't exist..."
    
    repositories=("${ECR_REPOSITORY_PREFIX}-backend" "${ECR_REPOSITORY_PREFIX}-frontend")
    
    for repo in "${repositories[@]}"; do
        if ! aws ecr describe-repositories --repository-names "$repo" --region "$AWS_REGION" &> /dev/null; then
            print_status "Creating ECR repository: $repo"
            aws ecr create-repository \
                --repository-name "$repo" \
                --region "$AWS_REGION" \
                --image-scanning-configuration scanOnPush=true \
                --encryption-configuration encryptionType=AES256
            print_success "Created ECR repository: $repo"
        else
            print_status "ECR repository already exists: $repo"
        fi
    done
}

# Function to authenticate Docker with ECR
authenticate_docker() {
    print_status "Authenticating Docker with ECR..."
    
    aws ecr get-login-password --region "$AWS_REGION" | \
        docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
    
    print_success "Docker authenticated with ECR"
}

# Function to build Docker images
build_images() {
    print_status "Building Docker images..."
    
    # Build backend image
    print_status "Building backend image..."
    docker build -t "${ECR_REPOSITORY_PREFIX}-backend:${IMAGE_TAG}" ./backend
    docker tag "${ECR_REPOSITORY_PREFIX}-backend:${IMAGE_TAG}" \
        "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${ECR_REPOSITORY_PREFIX}-backend:${IMAGE_TAG}"
    print_success "Backend image built successfully"
    
    # Build frontend image
    print_status "Building frontend image..."
    docker build -t "${ECR_REPOSITORY_PREFIX}-frontend:${IMAGE_TAG}" ./frontend
    docker tag "${ECR_REPOSITORY_PREFIX}-frontend:${IMAGE_TAG}" \
        "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${ECR_REPOSITORY_PREFIX}-frontend:${IMAGE_TAG}"
    print_success "Frontend image built successfully"
}

# Function to push images to ECR
push_images() {
    print_status "Pushing images to ECR..."
    
    # Push backend image
    print_status "Pushing backend image..."
    docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${ECR_REPOSITORY_PREFIX}-backend:${IMAGE_TAG}"
    print_success "Backend image pushed successfully"
    
    # Push frontend image
    print_status "Pushing frontend image..."
    docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${ECR_REPOSITORY_PREFIX}-frontend:${IMAGE_TAG}"
    print_success "Frontend image pushed successfully"
}

# Function to clean up local images (optional)
cleanup_local_images() {
    if [ "$CLEANUP_LOCAL" = "true" ]; then
        print_status "Cleaning up local images..."
        docker rmi "${ECR_REPOSITORY_PREFIX}-backend:${IMAGE_TAG}" || true
        docker rmi "${ECR_REPOSITORY_PREFIX}-frontend:${IMAGE_TAG}" || true
        docker rmi "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${ECR_REPOSITORY_PREFIX}-backend:${IMAGE_TAG}" || true
        docker rmi "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${ECR_REPOSITORY_PREFIX}-frontend:${IMAGE_TAG}" || true
        print_success "Local images cleaned up"
    fi
}

# Function to display image URIs
display_image_uris() {
    print_success "Build and push completed successfully!"
    echo ""
    print_status "Image URIs:"
    echo "Backend:  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${ECR_REPOSITORY_PREFIX}-backend:${IMAGE_TAG}"
    echo "Frontend: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${ECR_REPOSITORY_PREFIX}-frontend:${IMAGE_TAG}"
    echo ""
    print_status "You can now use these URIs in your ECS task definitions."
}

# Main execution
main() {
    echo "=========================================="
    echo "SEO Tech Check - Build and Push to ECR"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    validate_aws_credentials
    create_ecr_repositories
    authenticate_docker
    build_images
    push_images
    cleanup_local_images
    display_image_uris
}

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Build and push SEO Tech Check Docker images to Amazon ECR"
    echo ""
    echo "Environment Variables:"
    echo "  AWS_REGION              AWS region (default: us-east-1)"
    echo "  AWS_ACCOUNT_ID          AWS account ID (auto-detected if not set)"
    echo "  ECR_REPOSITORY_PREFIX   ECR repository prefix (default: seo-tech-check)"
    echo "  IMAGE_TAG               Docker image tag (default: latest)"
    echo "  CLEANUP_LOCAL           Clean up local images after push (default: false)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Use default settings"
    echo "  AWS_REGION=us-west-2 $0              # Use us-west-2 region"
    echo "  IMAGE_TAG=v1.0.0 $0                  # Use specific tag"
    echo "  CLEANUP_LOCAL=true $0                # Clean up local images"
    echo ""
}

# Check for help flag
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

# Run main function
main "$@"
