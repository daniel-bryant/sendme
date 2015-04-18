class PostsController < ApplicationController
  before_action :logged_in_user, only: [:new, :create, :edit, :update]
  before_action :admin_user,     only: [:new, :create, :edit, :update]

  def index
    @posts = Post.all
  end

  def new
    @post = Post.new
  end

  def create
    @post = Post.new(post_params.merge(user: current_user))
    if @post.save
      flash[:success] = "Post created"
      redirect_to @post
    else
      render :new
    end
  end

  def show
    @post = Post.find(params[:id])
  end

  def edit
    @post = Post.find(params[:id])
  end

  def update
    @post = Post.find(params[:id])
    if @post.update_attributes(post_params)
      flash[:success] = "Post updated"
      redirect_to @post
    else
      render :edit
    end
  end

  private
    def post_params
      params.require(:post).permit(:name, :content)
    end

    def admin_user
      unless current_user.email == "bryant.daniel.j@gmail.com"
        flash[:danger] = "Admin privileges are required."
        redirect_to(root_url)
      end
    end
end
