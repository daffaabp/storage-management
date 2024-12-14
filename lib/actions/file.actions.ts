"use server"

import { InputFile } from "node-appwrite/file";
import { createAdminClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { ID, Models, Query } from "node-appwrite";
import { constructFileUrl, getFileType, parseStringify } from "../utils";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./user.actions";

// Fungsi untuk menangani error, mencetak error ke konsol, dan melempar error agar bisa dilacak lebih lanjut.
const handleError = (error: unknown, message: string) => {
    console.log(error, message);
    throw error;
}

export const uploadFile = async ({
    file,
    ownerId,
    accountId,
    path,
}: UploadFileProps) => {
    // Membuat client admin Appwrite untuk mengakses layanan storage dan databases.
    const { storage, databases } = await createAdminClient();

    try {
        // Mengubah file menjadi format yang dapat diunggah oleh Appwrite (InputFile)
        const inputFile = InputFile.fromBuffer(file, file.name);

        // Mengunggah file ke bucket storage di Appwrite
        const bucketFile = await storage.createFile(
            appwriteConfig.bucketId,
            ID.unique(),
            inputFile,
        );

        // Menyusun metadata file untuk disimpan di database Appwrite, seperti tipe, ukuran, dan URL file.
        const fileDocument = {
            type: getFileType(bucketFile.name).type,
            name: bucketFile.name,
            url: constructFileUrl(bucketFile.$id),
            extension: getFileType(bucketFile.name).extension,
            size: bucketFile.sizeOriginal,
            owner: ownerId,
            accountId,
            users: [],
            bucketFileId: bucketFile.$id,
        };

        // Menyimpan metadata file di database. 
        const newFile = await databases
            .createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.filesCollectionId,
                ID.unique(),
                fileDocument,
            )
            // Jika gagal, file yang telah diunggah akan dihapus dari storage.
            .catch(async (error: unknown) => {
                await storage.deleteFile(appwriteConfig.bucketId, bucketFile.$id);
                handleError(error, "Failed to create file document");
            });

        // Merevalidasi halaman tertentu agar data baru (misalnya daftar file) langsung terlihat. Fungsi parseStringify membantu memformat data sebelum dikembalikan.
        revalidatePath(path);
        return parseStringify(newFile);
    } catch (error) {
        handleError(error, "Failed to upload file");
    }
};

const createQueries = (currentUser: Models.Document) => {
    const queries = [
        Query.or([
            // Mencari dokumen dengan nilai tertentu pada atribut tertentu.
            Query.equal("owner", [currentUser.$id]),
            // Mencari dokumen di mana atribut memiliki array dgn nilai tertentu.
            Query.contains("users", [currentUser.email]),
        ]),
    ];

    // TODO: Search, sort, limits ....    
    return queries;
}

export const getFiles = async () => {
    const { databases } = await createAdminClient();

    try {
        // dapatkan pengguna saat ini
        const currentUser = await getCurrentUser();

        if (!currentUser) throw new Error('User not found');

        const queries = createQueries(currentUser);

        console.log({ currentUser, queries });


        const files = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            queries,
        );
        console.log({ files });
        return parseStringify(files);

    } catch (error) {
        handleError(error, "Failed to get files");
    }
}

export const renameFile = async ({fileId, name, extension, path}: RenameFileProps) => {
    const { databases } = await createAdminClient();

    try {
        const newName = `${name}.${extension}`;
        const updatedFile = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId,
            {
                name: newName,
            },
        );

        revalidatePath(path);
        return parseStringify(updatedFile);
    } catch (error) {
        handleError(error, "Failed to rename file");
    }
}