#!/bin/bash

# Check if Python 3.11 is installed
if ! command -v python3.11 &> /dev/null; then
    echo "python3.11 is not installed. Please install it and try again."
    exit 1
fi

# Load configurations from stack.conf if exists
if [[ -f stack.conf ]]; then
    while IFS='=' read -r key value; do
        case "$key" in
            'Stage') Stage=$value ;;
            'Region') Region=$value ;;
            'APPDomain') APPDomain=$value ;;
            'CustomDomain') CustomDomain=$value ;;
        esac
    done < stack.conf
fi

# Function to prompt and validate values
prompt_value() {
    local var_name="$1"
    local prompt_msg="$2"
    local default_value="$3"
    local validation_regex="$4"

    # If the variable is already set (from stack.conf), no need to prompt
    if [ -n "${!var_name}" ]; then
        return
    fi

    while true; do
        echo "$prompt_msg"
        read -r input_value
        input_value="${input_value:-$default_value}"

        if [[ ! $input_value =~ $validation_regex ]]; then
            echo "Invalid value. Try again."
            continue
        fi

        eval "$var_name='$input_value'"
        break
    done
}

# Prompt and validate the values if not provided in stack.conf
prompt_value APPDomain "Enter the app domain (e.g., example.com):" "" "^[a-zA-Z0-9.-]+$"
prompt_value CustomDomain "Use custom domain? (yes/no):" "no" "^(yes|no)$"
prompt_value Stage "Enter the environment name (dev, qa, prod):" "dev" "^(dev|qa|prod)$"
prompt_value Region "Enter the region name:" "us-east-1" "^[a-zA-Z0-9-]+$"

# Display values
echo "APP Domain: $APPDomain"
echo "Custom Domain: $CustomDomain"
echo "Stage: $Stage"
echo "Region: $Region"

read -p "Press Enter to proceed or Ctrl+C to exit..."

# Update and install tools
python3.11 -m pip install --upgrade pip
pip install --upgrade awscli aws-sam-cli

# Create or verify S3 bucket
Hyphen="-"
BucketName="${Stage}.${APPDomain}-deploy"
if ! aws s3api head-bucket --bucket "$BucketName" &> /dev/null; then
    echo "Creating S3 bucket: $BucketName"
    if ! aws s3api create-bucket --bucket "$BucketName" --region "$Region" --create-bucket-configuration LocationConstraint="$Region" &> /dev/null; then
        echo "Error creating bucket $BucketName. Check your permissions or the bucket name."
        exit 1
    fi
else
    echo "Bucket $BucketName already exists. Proceeding with operations."
fi

# Upload signal_message_checker.sh to S3
SignalCheckerScript="Chatbot/infrastructure/signal_message_checker.sh"
S3ScriptPath="s3://${BucketName}/signal_message_checker.sh"
echo "Uploading ${SignalCheckerScript} to ${S3ScriptPath}..."
aws s3 cp "${SignalCheckerScript}" "${S3ScriptPath}"

# Deploy with SAM
TemplateName="template.yaml"
StackName=${Stage}${Hyphen}${APPDomain//./-}

sam deploy -t "$TemplateName" --stack-name "$StackName" --s3-bucket "$BucketName" --region "$Region" --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND CAPABILITY_NAMED_IAM --parameter-overrides AppName="$APPDomain" Region="$Region" Stage="$Stage" StackName="$StackName" UseCustomDomain="$CustomDomain"

# Sync files to S3
# aws s3 sync app/dist s3://"${Stage}.${APPDomain}"
