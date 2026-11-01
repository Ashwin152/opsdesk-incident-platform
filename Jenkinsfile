
pipeline {
    agent any

    environment {
        DOCKERHUB_USER = 'ashwin152'
        EC2_HOST = '3.107.223.204'
        EC2_USER = 'ubuntu'
        EC2_DIR = '/home/ubuntu/opsdesk'
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/Ashwin152/opsdesk-incident-platform.git'
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    bat 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    bat 'npm install'
                    bat 'npm run build'
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                bat '''
                docker build -t %DOCKERHUB_USER%/opsdesk-backend:latest ./backend
                docker build -t %DOCKERHUB_USER%/opsdesk-frontend:latest ./frontend
                '''
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_TOKEN'
                    )
                ]) {
                    bat '''
                    docker login -u "%DOCKER_USER%" -p "%DOCKER_TOKEN%"
                    docker push %DOCKERHUB_USER%/opsdesk-backend:latest
                    docker push %DOCKERHUB_USER%/opsdesk-frontend:latest
                    docker logout
                    '''
                }
            }
        }

        stage('Copy Production Compose') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'ec2-ssh-key',
                        keyFileVariable: 'EC2_KEY'
                    )
                ]) {
                    powershell '''
                        $key = $env:EC2_KEY

                        icacls $key /inheritance:r
                        icacls $key /grant:r "*S-1-5-18:(F)" "*S-1-5-32-544:(F)"

                        if ($LASTEXITCODE -ne 0) {
                            throw "Failed to secure SSH key"
                        }

                        ssh -i "$key" -o StrictHostKeyChecking=accept-new ubuntu@3.107.223.204 "mkdir -p /home/ubuntu/opsdesk"

                        scp -i "$key" -o StrictHostKeyChecking=accept-new docker-compose.prod.yml ubuntu@3.107.223.204:/home/ubuntu/opsdesk/docker-compose.prod.yml

                        if ($LASTEXITCODE -ne 0) {
                            throw "Failed to copy production Compose file"
                        }
                    '''
                }
            }
        }

        stage('Deploy to AWS EC2') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'ec2-ssh-key',
                        keyFileVariable: 'EC2_KEY'
                    )
                ]) {
                    powershell '''
                        $key = $env:EC2_KEY

                        icacls $key /inheritance:r
                        icacls $key /grant:r "*S-1-5-18:(F)" "*S-1-5-32-544:(F)"

                        if ($LASTEXITCODE -ne 0) {
                            throw "Failed to secure SSH key"
                        }

                        ssh -i "$key" -o StrictHostKeyChecking=accept-new ubuntu@3.107.223.204 "cd /home/ubuntu/opsdesk && docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d"
                        
                        if ($LASTEXITCODE -ne 0) {
                            throw "EC2 deployment failed"
                        }
                    '''
                }
            }
        }

        stage('Application Health Check') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'ec2-ssh-key',
                        keyFileVariable: 'EC2_KEY'
                    )
                ]) {
                    powershell '''
                        $key = $env:EC2_KEY

                        icacls $key /inheritance:r
                        icacls $key /grant:r "*S-1-5-18:(F)" "*S-1-5-32-544:(F)"

                        if ($LASTEXITCODE -ne 0) {
                            throw "Failed to secure SSH key"
                        }

                        ssh -i "$key" -o StrictHostKeyChecking=accept-new ubuntu@3.107.223.204 "curl -fsS http://localhost/api/health"

                        if ($LASTEXITCODE -ne 0) {
                            throw "Application health check failed"
                        }
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'OpsDesk successfully deployed to AWS EC2!'
        }
        failure {
            echo 'OpsDesk deployment failed. Check the stage logs.'
        }
    }
}
