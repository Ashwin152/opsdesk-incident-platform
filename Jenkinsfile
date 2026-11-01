
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

        stage('Backend Build') {
            steps {
                dir('backend') {
                    bat 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Frontend Build') {
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

        stage('Push Images') {
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

        stage('Transfer Compose File') {
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
                            throw "SSH key permission update failed"
                        }

                        ssh -i "$key" -o StrictHostKeyChecking=accept-new ubuntu@3.107.223.204 "mkdir -p /home/ubuntu/opsdesk"

                        if ($LASTEXITCODE -ne 0) {
                            throw "EC2 directory creation failed"
                        }

                        scp -i "$key" -o StrictHostKeyChecking=accept-new docker-compose.prod.yml ubuntu@3.107.223.204:/home/ubuntu/opsdesk/docker-compose.prod.yml

                        if ($LASTEXITCODE -ne 0) {
                            throw "Compose file transfer failed"
                        }
                    '''
                }
            }
        }

        stage('Deploy to EC2') {
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
                            throw "SSH key permission update failed"
                        }

                        ssh -i "$key" -o StrictHostKeyChecking=accept-new ubuntu@3.107.223.204 "cd /home/ubuntu/opsdesk && test -f .env && docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d"

                        if ($LASTEXITCODE -ne 0) {
                            throw "EC2 deployment failed"
                        }
                    '''
                }
            }
        }

        stage('Health Check') {
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
                            throw "SSH key permission update failed"
                        }

                        ssh -i "$key" -o StrictHostKeyChecking=accept-new ubuntu@3.107.223.204 "for i in 1 2 3 4 5 6 7 8 9 10; do if curl -fsS http://localhost/api/health; then exit 0; fi; sleep 10; done; exit 1"

                        if ($LASTEXITCODE -ne 0) {
                            throw "OpsDesk health check failed"
                        }
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'OpsDesk deployed successfully to AWS EC2!'
        }

        failure {
            echo 'Deployment failed. Review the stage logs.'
        }
    }
}
