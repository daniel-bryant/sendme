class UsersController < ApplicationController
  before_action :logged_in_user, only: [:show, :edit, :update, :avatar]
  before_action :correct_user,   only: [:show, :edit, :update, :avatar]

  def show
    @user = User.find(params[:id])
  end

  def new
    @user = User.new
  end

  def create
    @user = User.new(user_params)
    if @user.save
      UserMailer.account_activation(@user).deliver_now
    else
      render :new
    end
  end

  def edit
    @user = User.find(params[:id])
  end

  def update
    @user = User.find(params[:id])
    if @user.update_attributes(user_params)
      flash[:success] = "Profile updated"
      redirect_to @user
    else
      render :edit
    end
  end

  def avatar
    @user = User.find(params[:id])
    @user.avatar = nil
    @user.save
    flash[:success] = "Avatar deleted"
    redirect_to edit_user_path @user
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
