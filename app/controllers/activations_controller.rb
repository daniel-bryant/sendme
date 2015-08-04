class ActivationsController < ApplicationController
  def new
  end

  def create
    user = User.find_by(email: params[:activation][:email].downcase)
    if user && !user.activated?
      user.update_activation_digest
      UserMailer.account_activation(user).deliver_now
    else
      flash.now[:danger] = 'Email address not found or already activated'
      render :new
    end
  end

  def edit
    user = User.find_by(email: params[:email])
    if user && !user.activated? && user.authenticated?(:activation, params[:id])
      user.activate
      log_in user
      flash[:success] = "Account activated!"
      redirect_to user
    else
      flash[:danger] = "Invalid activation link"
      redirect_to root_url
    end
  end
end
