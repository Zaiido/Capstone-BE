import Express from 'express';
import createHttpError from 'http-errors';
import CommentsModel from './model';
import PostsModel from "../posts/model";
import UsersModel from "../users/model";


const commentsRouter = Express.Router()

commentsRouter.get('/:postId/comments', async (request, response, next) => {
    try {
        const postId = request.params.postId;
        const comments = await CommentsModel.find({ post: postId }).populate('user');
        response.send(comments);
    } catch (error) {
        next(error);
    }
});

commentsRouter.get('/:postId/comments/:commentId', async (request, response, next) => {
    try {
        const postId = request.params.postId;
        const commentId = request.params.commentId;
        const comment = await CommentsModel.findOne({ _id: commentId, post: postId }).populate('user');

        if (comment) {
            response.send(comment);
        } else {
            next(createHttpError(404, `Comment with id ${commentId} not found in post with id ${postId}!`));
        }
    } catch (error) {
        next(error);
    }
});


commentsRouter.post('/:postId/comments', async (request, response, next) => {
    try {
        const postId = request.params.postId;
        const newComment = new CommentsModel({ ...request.body, post: postId });
        const { _id } = await newComment.save();
        response.status(201).send({ _id });
    } catch (error) {
        next(error);
    }
});

commentsRouter.delete('/:postId/comments/:commentId', async (request, response, next) => {
    try {
        const commentId = request.params.commentId;
        const deletedComment = await CommentsModel.findByIdAndDelete(commentId);
        if (deletedComment) {
            response.status(204).send();
        } else {
            next(createHttpError(404, `Comment with id ${commentId} not found!`));
        }
    } catch (error) {
        next(error);
    }
});

commentsRouter.put('/:postId/comments/:commentId', async (request, response, next) => {
    try {
        const commentId = request.params.commentId;
        const updatedComment = await CommentsModel.findByIdAndUpdate(
            commentId,
            { $set: request.body },
            { new: true }
        );
        if (updatedComment) {
            response.send(updatedComment);
        } else {
            next(createHttpError(404, `Comment with id ${commentId} not found!`));
        }
    } catch (error) {
        next(error);
    }
});



commentsRouter.post("/:postId/comments/:commentId/like", async (request, response, next) => {
    try {
        const { userId } = request.body;

        const post = await PostsModel.findById(request.params.postId);
        if (!post)
            return next(
                createHttpError(404, `Post with id ${request.params.postId} not found`)
            );

        const comment = await CommentsModel.findById(request.params.commentId);
        if (!comment)
            return next(
                createHttpError(404, `Comment with id ${request.params.commentId} not found`)
            );

        const user = await UsersModel.findById(userId);
        if (!user)
            return next(createHttpError(404, `User with id ${userId} not found`));

        if (comment.likes.includes(userId)) {
            const deleteLikes = await CommentsModel.findOneAndUpdate(
                { _id: request.params.commentId },
                { $pull: { likes: userId } },
                { new: true, runValidators: true }
            );
            response.send({
                deleteLikes,
                length: deleteLikes!.likes.length,
            });
        } else {
            const updatedComment = await CommentsModel.findOneAndUpdate(
                { _id: request.params.commentId },
                { $push: { likes: userId } },
                { new: true, runValidators: true, upsert: true }
            );
            response.send({
                updatedComment,
                length: updatedComment.likes.length,
            });
        }
    } catch (error) {
        next(error);
    }
});


export default commentsRouter