#!/bin/bash

# Video Creation Platform Deployment Script
# This script handles deployment to different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking system requirements..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f "$ENV_FILE" ]; then
        log_warning ".env file not found. Creating from template..."
        cp .env.example .env
        log_warning "Please edit .env file with your configuration before running again."
        exit 1
    fi
    
    log_success "All requirements met."
}

setup_environment() {
    log_info "Setting up environment for: $ENVIRONMENT"
    
    case $ENVIRONMENT in
        development)
            export COMPOSE_PROFILES=""
            ;;
        production)
            export COMPOSE_PROFILES="production"
            ;;
        monitoring)
            export COMPOSE_PROFILES="production,monitoring"
            ;;
        *)
            log_error "Unknown environment: $ENVIRONMENT"
            log_info "Available environments: development, production, monitoring"
            exit 1
            ;;
    esac
}

build_images() {
    log_info "Building Docker images..."
    
    # Build backend
    log_info "Building backend image..."
    docker-compose build backend
    
    # Build frontend
    log_info "Building frontend image..."
    docker-compose build frontend
    
    log_success "Images built successfully."
}

setup_database() {
    log_info "Setting up databases..."
    
    # Start database services first
    docker-compose up -d postgres mongodb redis
    
    # Wait for databases to be ready
    log_info "Waiting for databases to be ready..."
    sleep 30
    
    # Run database migrations
    log_info "Running database migrations..."
    docker-compose exec -T backend npm run migration:run || log_warning "Migration failed or no migrations to run"
    
    # Seed initial data
    log_info "Seeding initial data..."
    docker-compose exec -T backend npm run seed || log_warning "Seeding failed or no seeds to run"
    
    log_success "Database setup completed."
}

deploy_services() {
    log_info "Deploying services..."
    
    # Start all services
    if [ "$ENVIRONMENT" = "development" ]; then
        docker-compose up -d
    else
        docker-compose --profile $COMPOSE_PROFILES up -d
    fi
    
    log_success "Services deployed successfully."
}

health_check() {
    log_info "Performing health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check backend health
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_success "Backend is healthy"
    else
        log_error "Backend health check failed"
        return 1
    fi
    
    # Check frontend health
    if curl -f http://localhost:80/health > /dev/null 2>&1; then
        log_success "Frontend is healthy"
    else
        log_error "Frontend health check failed"
        return 1
    fi
    
    log_success "All health checks passed."
}

show_status() {
    log_info "Service status:"
    docker-compose ps
    
    echo ""
    log_info "Application URLs:"
    echo "Frontend: http://localhost:80"
    echo "Backend API: http://localhost:3000"
    echo "API Documentation: http://localhost:3000/api"
    
    if [ "$ENVIRONMENT" = "monitoring" ]; then
        echo "Grafana: http://localhost:3001"
        echo "Prometheus: http://localhost:9090"
    fi
}

backup_data() {
    log_info "Creating data backup..."
    
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup PostgreSQL
    docker-compose exec -T postgres pg_dump -U postgres video_creation > "$BACKUP_DIR/postgres_backup.sql"
    
    # Backup MongoDB
    docker-compose exec -T mongodb mongodump --db video_creation --out /tmp/mongo_backup
    docker cp $(docker-compose ps -q mongodb):/tmp/mongo_backup "$BACKUP_DIR/mongodb_backup"
    
    # Backup uploaded files
    docker cp $(docker-compose ps -q backend):/app/uploads "$BACKUP_DIR/uploads"
    
    log_success "Backup created at: $BACKUP_DIR"
}

restore_data() {
    if [ -z "$2" ]; then
        log_error "Please specify backup directory: ./deploy.sh restore <backup_directory>"
        exit 1
    fi
    
    BACKUP_DIR="$2"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        log_error "Backup directory not found: $BACKUP_DIR"
        exit 1
    fi
    
    log_info "Restoring data from: $BACKUP_DIR"
    
    # Restore PostgreSQL
    if [ -f "$BACKUP_DIR/postgres_backup.sql" ]; then
        docker-compose exec -T postgres psql -U postgres -d video_creation < "$BACKUP_DIR/postgres_backup.sql"
        log_success "PostgreSQL data restored"
    fi
    
    # Restore MongoDB
    if [ -d "$BACKUP_DIR/mongodb_backup" ]; then
        docker cp "$BACKUP_DIR/mongodb_backup" $(docker-compose ps -q mongodb):/tmp/
        docker-compose exec -T mongodb mongorestore --db video_creation /tmp/mongodb_backup/video_creation
        log_success "MongoDB data restored"
    fi
    
    # Restore uploaded files
    if [ -d "$BACKUP_DIR/uploads" ]; then
        docker cp "$BACKUP_DIR/uploads" $(docker-compose ps -q backend):/app/
        log_success "Uploaded files restored"
    fi
}

cleanup() {
    log_info "Cleaning up..."
    
    # Stop all services
    docker-compose down
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes (optional)
    read -p "Remove unused volumes? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker volume prune -f
    fi
    
    log_success "Cleanup completed."
}

update() {
    log_info "Updating application..."
    
    # Pull latest code (if using git)
    if [ -d ".git" ]; then
        git pull origin main
    fi
    
    # Rebuild images
    build_images
    
    # Restart services with zero downtime
    docker-compose up -d --no-deps backend frontend
    
    # Run migrations
    docker-compose exec -T backend npm run migration:run
    
    log_success "Update completed."
}

show_logs() {
    SERVICE=${2:-""}
    
    if [ -n "$SERVICE" ]; then
        docker-compose logs -f "$SERVICE"
    else
        docker-compose logs -f
    fi
}

# Main script logic
case "${1:-deploy}" in
    deploy)
        check_requirements
        setup_environment
        build_images
        setup_database
        deploy_services
        health_check
        show_status
        ;;
    backup)
        backup_data
        ;;
    restore)
        restore_data "$@"
        ;;
    cleanup)
        cleanup
        ;;
    update)
        update
        ;;
    logs)
        show_logs "$@"
        ;;
    status)
        show_status
        ;;
    stop)
        log_info "Stopping services..."
        docker-compose down
        log_success "Services stopped."
        ;;
    restart)
        log_info "Restarting services..."
        docker-compose restart
        log_success "Services restarted."
        ;;
    *)
        echo "Usage: $0 {deploy|backup|restore|cleanup|update|logs|status|stop|restart} [environment]"
        echo ""
        echo "Commands:"
        echo "  deploy [env]     - Deploy the application (env: development, production, monitoring)"
        echo "  backup           - Create a backup of data"
        echo "  restore <dir>    - Restore data from backup directory"
        echo "  cleanup          - Stop services and clean up resources"
        echo "  update           - Update application with latest changes"
        echo "  logs [service]   - Show logs (optionally for specific service)"
        echo "  status           - Show service status and URLs"
        echo "  stop             - Stop all services"
        echo "  restart          - Restart all services"
        echo ""
        echo "Examples:"
        echo "  $0 deploy development"
        echo "  $0 deploy production"
        echo "  $0 backup"
        echo "  $0 restore backups/20231201_120000"
        echo "  $0 logs backend"
        exit 1
        ;;
esac

