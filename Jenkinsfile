
pipeline {
    agent any

    options {
        timestamps()
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

        stage('Validate Configuration') {
            steps {
                bat 'docker compose config -q'
            }
        }

        stage('Build Docker Images') {
            steps {
                bat 'docker compose build'
            }
        }

        stage('Test Backend') {
            steps {
                dir('backend') {
                    bat 'mvn -B test'
                }
            }
        }

        stage('Start Application') {
            steps {
                bat 'docker compose up -d'
            }
        }

        stage('Health Check') {
            steps {
                bat 'powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference = ''Stop''; $urls = @(''http://localhost:8080/api/health'', ''http://localhost:3000''); foreach ($url in $urls) { $ok = $false; for ($i = 0; $i -lt 30; $i++) { try { $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5; if ($response.StatusCode -eq 200) { $ok = $true; break } } catch {}; Start-Sleep -Seconds 2 }; if (-not $ok) { throw ('Health check failed: ' + $url) }; Write-Host ('Passed: ' + $url) }"'
            }
        }
    }

    post {
        always {
            bat 'docker compose ps'
        }
        success {
            echo 'CI pipeline passed: compile, validate, build, test, and health checks.'
        }
        failure {
            echo 'Pipeline failed. Review the failed stage and console output.'
            bat 'docker compose logs --tail=100'
        }
    }
}
