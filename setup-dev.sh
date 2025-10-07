#!/bin/bash

# Ratio1 Drive Development Environment Setup Script

set -e

echo "🚀 Setting up Ratio1 Drive Development Environment..."

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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker Desktop first."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker Desktop first."
    exit 1
fi

print_success "Docker is available and running"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_warning "docker-compose not found, trying 'docker compose' (newer Docker versions)"
    if ! docker compose version &> /dev/null; then
        print_error "Neither docker-compose nor docker compose is available."
        exit 1
    fi
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

print_success "Docker Compose is available"

# Install mock service dependencies
print_status "Installing mock service dependencies..."

if [ -d "mock-services/cstore" ]; then
    cd mock-services/cstore
    npm install --silent
    cd ../..
    print_success "CStore mock service dependencies installed"
else
    print_warning "CStore mock service directory not found"
fi

if [ -d "mock-services/r1fs" ]; then
    cd mock-services/r1fs
    npm install --silent
    cd ../..
    print_success "R1FS mock service dependencies installed"
else
    print_warning "R1FS mock service directory not found"
fi

# Build the development Docker image
print_status "Building development Docker image..."
docker build -f Dockerfile.dev -t ratio1-drive:dev . --quiet

if [ $? -eq 0 ]; then
    print_success "Development Docker image built successfully"
else
    print_error "Failed to build development Docker image"
    exit 1
fi

# Check if ports are available
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port $port is already in use. $service may not start properly."
        return 1
    else
        print_success "Port $port is available for $service"
        return 0
    fi
}

print_status "Checking port availability..."
check_port 3333 "Next.js App"
check_port 30000 "CStore API"
check_port 30001 "R1FS API"

# Start the development environment
print_status "Starting development environment..."
$DOCKER_COMPOSE -f docker-compose.dev.yml up -d

if [ $? -eq 0 ]; then
    print_success "Development environment started successfully!"
else
    print_error "Failed to start development environment"
    exit 1
fi

# Wait a moment for services to start
print_status "Waiting for services to start..."
sleep 5

# Check if services are running
print_status "Checking service status..."

if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "ratio1-drive-dev"; then
    print_success "Next.js application is running"
else
    print_error "Next.js application failed to start"
fi

if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "cstore-api-mock"; then
    print_success "CStore API mock service is running"
else
    print_error "CStore API mock service failed to start"
fi

if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "r1fs-api-mock"; then
    print_success "R1FS API mock service is running"
else
    print_error "R1FS API mock service failed to start"
fi

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "📱 Access your application:"
echo "   • Next.js App: http://localhost:3333"
echo "   • CStore API: http://localhost:30000"
echo "   • R1FS API: http://localhost:30001"
echo ""
echo "📊 View logs:"
echo "   • All services: $DOCKER_COMPOSE -f docker-compose.dev.yml logs -f"
echo "   • Next.js app: $DOCKER_COMPOSE -f docker-compose.dev.yml logs -f ratio1-drive-dev"
echo "   • CStore API: $DOCKER_COMPOSE -f docker-compose.dev.yml logs -f cstore-api-mock"
echo "   • R1FS API: $DOCKER_COMPOSE -f docker-compose.dev.yml logs -f r1fs-api-mock"
echo ""
echo "🛑 Stop services: $DOCKER_COMPOSE -f docker-compose.dev.yml down"
echo ""
echo "📖 For more information, see DEV_CONTAINER_README.md" 