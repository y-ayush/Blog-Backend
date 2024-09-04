import mongoose, { Schema } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const postSchema = new Schema(
    {
        slug: {
            type: String,
            index: true,
            unique: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: Boolean,
            required: true,
            index: true,
        },
        featuredImageUrl: {
            type: String,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

postSchema.plugin(aggregatePaginate);

export const Post = mongoose.model("Post", postSchema);
