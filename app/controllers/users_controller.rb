class UsersController < ApplicationController
  before_action :logged_in_user, only: [:show, :edit, :update]
  before_action :correct_user,   only: [:show, :edit, :update]

  def show
    @user = User.find(params[:id])
  end

  def new
    @user = User.new
  end

  def create
    @user = User.new(user_params)
    if @user.save
      log_in @user
      redirect_to @user
    else
      render :new
    end
  end

  def edit
    @user = User.find(params[:id])
  end

  def update
    @user = User.find(params[:id])
    if params[:avatar_destroy]
      @user.avatar = nil
      @user.save
      flash[:success] = "Avatar deleted"
      redirect_to edit_user_path @user and return
    end

    if @user.update_attributes(user_params)
      redirect_to @user
    else
      render :edit
    end
  end

  private
    def user_params
      params.require(:user).permit(:name, :email, :title, :description, :password, :password_confirmation, :avatar)
    end

    def correct_user
      @user = User.find(params[:id])
      redirect_to(root_url) unless current_user?(@user)
    end
end
