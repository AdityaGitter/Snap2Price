# ==============================================================================
# Terraform Input Variables for ShopSmart AI Infrastructure
# ==============================================================================

variable "aws_region" {
  description = "AWS Region to deploy resources (e.g., ap-south-1 for Mumbai, us-east-1 for N. Virginia)"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Project name tag for all provisioned infrastructure resources"
  type        = string
  default     = "shopsmart-ai"
}

variable "environment" {
  description = "Deployment environment (production, staging, demo)"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "CIDR block for the dedicated Virtual Private Cloud (VPC)"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the public subnet hosting the EC2 instance"
  type        = string
  default     = "10.0.1.0/24"
}

variable "availability_zone" {
  description = "Availability zone for the public subnet"
  type        = string
  default     = "ap-south-1a"
}

variable "instance_type" {
  description = "EC2 instance size. Recommended: t3.small or t3.medium for running ML & Docker containers; t2.micro for AWS Free-Tier demo"
  type        = string
  default     = "t3.small"
}

variable "key_name" {
  description = "Name of an existing AWS SSH Key Pair used for EC2 instance access"
  type        = string
  default     = ""
}

variable "allowed_ssh_cidr" {
  description = "IP CIDR permitted to SSH into EC2 (set to your public IP/32 for production safety)"
  type        = string
  default     = "0.0.0.0/0"
}

variable "ebs_volume_size" {
  description = "Root EBS storage volume size in GB"
  type        = number
  default     = 30
}

variable "repo_url" {
  description = "Git repository URL for cloning the ShopSmart AI codebase in cloud-init user_data"
  type        = string
  default     = "https://github.com/your-username/shopsmart-ai.git"
}
