import type { UploadTask, UploadTaskSnapshot } from 'firebase/storage';
import { getDownloadURL, ref, storage, uploadBytesResumable } from './firebase';

const UPLOAD_TIMEOUT_MS = 45_000;

function withTimeout<T>(operation: Promise<T>, errorMessage: string, onTimeout?: () => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      onTimeout?.();
      reject(new Error(errorMessage));
    }, UPLOAD_TIMEOUT_MS);

    operation.then(
      (result) => {
        window.clearTimeout(timeoutId);
        resolve(result);
      },
      (error: unknown) => {
        window.clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

function waitForUploadTask(uploadTask: UploadTask): Promise<UploadTaskSnapshot> {
  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed', undefined, reject, () => resolve(uploadTask.snapshot));
  });
}

export async function uploadPhoneImage(file: File): Promise<string> {
  const storageRef = ref(storage, `inventory/${Date.now()}_phone_${file.name}`);
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type || 'image/jpeg',
  });

  const snapshot = await withTimeout(
    waitForUploadTask(uploadTask),
    'The photo upload timed out after 45 seconds. Check your connection and try again.',
    () => uploadTask.cancel()
  );

  return withTimeout(
    getDownloadURL(snapshot.ref),
    'Photo upload finished, but getting its link timed out. Please try again.'
  );
}
