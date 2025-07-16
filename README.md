Deploying Your Pranayama App to Cloud Run
This guide will walk you through the entire process of deploying your React-based Pranayama application to Google Cloud Run, a fully managed platform for running containerized applications.

Step 1: Prerequisites
Before you begin, please ensure you have the following set up:

Google Cloud Project: You need an active Google Cloud project with billing enabled.

gcloud CLI: The Google Cloud Command-Line Interface must be installed and authenticated. You can install it from the official documentation. After installation, run gcloud auth login and gcloud config set project YOUR_PROJECT_ID.

Project Structure: The deployment process assumes a standard React project structure. If you haven't already, create one using Create React App:

Run npx create-react-app pranayama-app in your terminal.

Navigate into the new directory: cd pranayama-app.

Replace the contents of src/App.js with the React code from the Pranayama app.

Make sure to install the necessary dependencies by running npm install framer-motion lucide-react.

Step 2: Create Configuration Files
In the root directory of your pranayama-app project, you will need to create two new files: a Dockerfile and a .dockerignore file. These files will tell Google Cloud Build how to create a lightweight, optimized container for your application.

I have generated the content for both files for you.

Step 3: Deployment Commands
With the configuration files in place, you can now proceed with the deployment. Open your terminal in the root of your project directory and run the following commands one by one.

First, set up some environment variables to make the subsequent commands cleaner. Replace your-gcp-project-id with your actual Google Cloud Project ID and choose a region like us-central1.

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