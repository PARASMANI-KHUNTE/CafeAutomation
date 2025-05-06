const { uploadToFirebase, deleteFromFirebase } = require('./UploadToFirebase');

const uploadImage = async (file) => {
    if (!file) return null;
    const imageUrl = await uploadToFirebase(file);
    return imageUrl;
}

const deleteImage = async (imageUrl) => {
    if (!imageUrl) return;
    await deleteFromFirebase(imageUrl);
}

const updateImage = async (file) => {
    if (!file) return null;
    const imageUrl = await uploadToFirebase(file);
    return imageUrl;
}

module.exports = { uploadImage, deleteImage, updateImage };

