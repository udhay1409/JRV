import mongoose from 'mongoose';

export function getModel(modelName, schema) {
    return mongoose.models[modelName] || mongoose.model(modelName, schema);
}
