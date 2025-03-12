import AWS from 'aws-sdk';

AWS.config.update({
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY
})

const s3 = new AWS.S3({
    params: {
        Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
    },
    region: 'eu-north-1',
})

export async function uploadToS3(file:File) {
    try {
        const file_key = "uploads/" + Date.now().toString() + file.name.replace(" ", "-");

        const params = {
            Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
            Key: file_key,
            Body: file
        }

        const upload = s3.putObject(params).on('httpUploadProgress', (evt) => {
            console.log('uploading to s3...', parseInt(((evt.loaded*100)/evt.total).toString()), '%')
        }).promise()

        await upload.then(data => {
            console.log("Successfully uploaded to S3");
        })

        return Promise.resolve({
            file_key,
            file_name: file.name,
        })
    } catch (error) {}
}

export async function deleteFromS3(file_key: string) {
    try {
        const params = {
            Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
            Key: file_key,
        };

        await s3.deleteObject(params).promise();
        console.log("Successfully deleted file from S3");

        return { success: true, message: "File deleted successfully." };
    } catch (error) {
        console.error("Failed to delete file from S3", error);
        return { success: false, message: "Failed to delete file." };
    }
}

export function getS3Url(file_key: string) {
    const url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.eu-north-1.amazonaws.com/${file_key}`;
    return url;
}