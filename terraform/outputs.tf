# ==============================================================================
# Terraform Outputs for ShopSmart AI
# ==============================================================================

output "instance_id" {
  description = "AWS EC2 Instance ID"
  value       = aws_instance.app_server.id
}

output "public_ip" {
  description = "Public Elastic IP address of the deployed EC2 instance"
  value       = aws_eip.app_eip.public_ip
}

output "application_url" {
  description = "URL to access the live ShopSmart AI application"
  value       = "http://${aws_eip.app_eip.public_ip}"
}

output "api_documentation_url" {
  description = "URL for interactive OpenAPI / Swagger API documentation"
  value       = "http://${aws_eip.app_eip.public_ip}/docs"
}

output "ssh_command" {
  description = "Command to SSH connect to the EC2 server"
  value       = "ssh -i <path-to-your-key.pem> ubuntu@${aws_eip.app_eip.public_ip}"
}
