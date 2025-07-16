export PROJECT_ID="nibbly-prod"
export REGION="us-central1"
export REPO_NAME="pranayama-repo"
export IMAGE_NAME="pranayama-app"
export SERVICE_NAME="pranayama-app-service"

Next, enable the necessary Google Cloud services:

gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

Create a repository in Artifact Registry to store your container image:

gcloud artifacts repositories create "$REPO_NAME" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Repository for Pranayama app"

Now, submit your code to Cloud Build. This command will read your Dockerfile, build the container image, and push it to the Artifact Registry repository you just created:

gcloud builds submit . \
    --tag="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest"

Finally, deploy your container image to Cloud Run. This command creates a new Cloud Run service, points it to your container image, and makes it publicly accessible:

gcloud run deploy "$SERVICE_NAME" \
    --image="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest" \
    --platform="managed" \
    --region="$REGION" \
    --allow-unauthenticated

After the final command completes successfully, it will output the URL for your newly deployed service. You can visit this URL in your browser to see your live Pranayama application.