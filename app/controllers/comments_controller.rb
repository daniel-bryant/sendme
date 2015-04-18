class CommentsController < ApplicationController
  before_action :logged_in_user, only: [:create, :update, :destroy]
  before_action :correct_user,   only: [:update, :destroy]

  def create
    @post = Post.find(params[:post_id])
    @comment = @post.comments.build(comment_params.merge(user: current_user))
    if @comment.save
      flash[:success] = "Comment added"
    else
      flash[:danger] = @comment.errors.full_messages.join(', ')
    end
    redirect_to @post
  end

  def update
    if @comment.update_attributes(comment_params)
      flash[:success] = "Comment updated"
    else
      flash[:danger] = @comment.errors.full_messages.join(', ')
    end
    redirect_to @comment.post
  end

  def destroy
    @comment.destroy
    flash[:success] = "Comment deleted"
    redirect_to @comment.post
  end

  private
    def comment_params
      params.require(:comment).permit(:content)
    end

    def correct_user
      @comment = Comment.find(params[:id])
      redirect_to(root_url) unless current_user?(@comment.user)
    end
end
