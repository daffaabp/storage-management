import { cn, getFileIcon } from '@/lib/utils'
import Image from 'next/image'
import React from 'react'

interface Props {
    type: string
    extension: string
    url?: string
    imageClassName?: string
    className?: string
}

const Thumbnail = ({ type, extension, url = "", imageClassName, className }: Props) => {
    // Cek apakah file adalah gambar (bukan SVG) untuk menentukan apakah perlu menampilkan thumbnail gambar atau ikon.
    const isImage = type === 'image' && extension !== 'svg';
    return (
        <figure className={cn("thumbnail", className)}>
            {/* Jika file adalah gambar, tampilkan thumbnail menggunakan URL. Jika bukan, gunakan ikon sesuai ekstensi. */}
            <Image src={isImage ? url : getFileIcon(extension, type)} alt="thumbnail" width={100} height={100} className={cn("size-8 object-contain", imageClassName, isImage && "thumbnail-image")} />
        </figure>
    )
}

export default Thumbnail
