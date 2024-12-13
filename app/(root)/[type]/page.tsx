import Card from '@/components/Card';
import Sort from '@/components/Sort';
import { getFiles } from '@/lib/actions/file.actions';
import { Models } from 'node-appwrite';
import React from 'react'

const Page = async ({ params }: SearchParamProps) => {
    // Ambil parameter "type" dari URL
    const type = ((await params)?.type as string) || "";

    // Ambil file dari server
    const files = await getFiles();

    return <div className='page-container'>
        <section className='w-full'>
            <h1 className='h1 capitalize'>{type}</h1>
            <div className="total-size-section">
                <p className='body-1'>
                    Total: <span className='h5'>0 MB</span>
                </p>

                <div className='sort-container'>
                    <p className='body-1 hidden sm:block text-light-200'>Sort by:</p>
                    <Sort />
                </div>
            </div>
        </section>

        {/* Render the files */}
        {/* Jika file ditemukan (files.total > 0), render daftar file. Jika tidak, tampilkan pesan "No files uploaded". */}
        {files.total > 0 ? (
            <section className='file-list'>
                {files.documents.map((file: Models.Document) => (
                    <Card key={file.$id} file={file} />
                ))}
            </section>
        ) : <p className='empty-list'>No files uploaded</p>}
    </div>
}

export default Page
