#!/bin/bash

# SEO Tech Check - ECR Setup Script
# This script creates ECR repositories and pushes Docker images

set -e

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME=${PROJECT_NAME:-seo-tech-check}
ENVIRONMENT=${ENVIRONMENT:-production}

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

# Function to create ECR repository if it doesn't exist
create_ecr_repository() {
    local repo_name="$1"
    
    if ! aws ecr describe-repositories --repository-names "$repo_name" --region "$AWS_REGION" &>/dev/null; then
        print_status "Creating ECR repository: $repo_name"
        aws ecr create-repository \
            --repository-name "$repo_name" \
            --image-scanning-configuration scanOnPush=true \
            --region "$AWS_REGION"
        print_success "Created ECR repository: $repo_name"
    else
        print_status "ECR repository already exists: $repo_name"
    fi
}

# Function to build and push Docker image
build_and_push_image() {
    local service_name="$1"
    local repo_name="${PROJECT_NAME}-${service_name}"
    local image_tag="${ENVIRONMENT}"
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    local repo_uri="${account_id}.dkr.ecr.${AWS_REGION}.amazonaws.com/${repo_name}"
    
    print_status "Building Docker image for $service_name..."
    docker build -t "$repo_name:$image_tag" "./$service_name"
    
    print_status "Tagging image..."
    docker tag "$repo_name:$image_tag" "$repo_uri:$image_tag"
    docker tag "$repo_name:$image_tag" "$repo_uri:latest"
    
    print_status "Pushing image to ECR..."
    docker push "$repo_uri:$image_tag"
    docker push "$repo_uri:latest"
    
    print_success "Successfully pushed $service_name image to ECR"
    echo "Image URI: $repo_uri:latest"
}

# Main execution
main() {
    echo "=================================================="
    echo "SEO Tech Check - ECR Setup and Image Push"
    echo "=================================================="
    echo ""
    
    # Get AWS account ID
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    print_status "Using AWS Account ID: $account_id"
    
    # Login to ECR
    print_status "Logging in to ECR..."
    aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "${account_id}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    
    # Create repositories
    create_ecr_repository "${PROJECT_NAME}-backend"
    create_ecr_repository "${PROJECT_NAME}-frontend"
    
    # Build and push images
    build_and_push_image "backend"
    build_and_push_image "frontend"
    
    print_success "ECR setup and image push completed!"
    print_status "You can now run the CloudFormation deployment script"
}

# Run main function
main "$@"
