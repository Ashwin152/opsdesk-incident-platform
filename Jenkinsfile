
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Compile Backend') {
            steps {
                dir('backend') {
                    bat 'mvn -B clean compile'
                }
            }
        }

        stage('Validate Docker Compose') {
            steps {
                bat 'docker compose config -q'
            }
        }

        stage('Build Docker Images') {
            steps {
                bat 'docker compose build'
            }
        }

        stage('Run Backend Tests') {
            steps {
                dir('backend') {
                    bat 'mvn -B test'
                }
            }
        }

        stage('Deploy Application') {
            steps {
                bat 'docker compose up -d'
            }
        }

        stage('Check Backend Health') {
            steps {
                powershell '''
                    $ErrorActionPreference = "Stop"
                    $url = "http://localhost:8080/api/health"
                    $success = $false

                    for ($i = 1; $i -le 30; $i++) {
                        try {
                            $response = Invoke-WebRequest `
                                -Uri $url `
                                -UseBasicParsing `
                                -TimeoutSec 5

                            if ($response.StatusCode -eq 200) {
                                $success = $true
                                Write-Host "Backend health check passed."
                                Write-Host $response.Content
                                break
                            }
                        }
                        catch {
                            Write-Host "Waiting for backend... attempt $i of 30"
                            Start-Sleep -Seconds 2
                        }
                    }

                    if (-not $success) {
                        throw "Backend health check failed."
                    }
                '''
            }
        }

        stage('Check Frontend') {
            steps {
                powershell '''
                    $ErrorActionPreference = "Stop"
                    $url = "http://localhost:3000"
                    $success = $false

                    for ($i = 1; $i -le 30; $i++) {
                        try {
                            $response = Invoke-WebRequest `
                                -Uri $url `
                                -UseBasicParsing `
                                -TimeoutSec 5

                            if ($response.StatusCode -eq 200) {
                                $success = $true
                                Write-Host "Frontend health check passed."
                                break
                            }
                        }
                        catch {
                            Write-Host "Waiting for frontend... attempt $i of 30"
                            Start-Sleep -Seconds 2
                        }
                    }

                    if (-not $success) {
                        throw "Frontend health check failed."
                    }
                '''
            }
        }

        stage('Test Incidents API') {
            steps {
                powershell '''
                    $ErrorActionPreference = "Stop"
                    $url = "http://localhost:8080/api/incidents"

                    $response = Invoke-WebRequest `
                        -Uri $url `
                        -UseBasicParsing `
                        -TimeoutSec 10

                    if ($response.StatusCode -ne 200) {
                        throw "Incidents API test failed."
                    }

                    Write-Host "Incidents API test passed."
                    Write-Host $response.Content
                '''
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: OpsDesk passed the pipeline and health checks.'
        }

        failure {
            echo 'FAILURE: Check the stage logs for the error.'
            bat 'docker compose ps'
            bat 'docker compose logs --tail=100'
        }

        always {
            echo 'OpsDesk CI/CD pipeline completed.'
        }
    }
}
