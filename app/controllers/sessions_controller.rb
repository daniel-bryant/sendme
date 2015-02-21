class SessionsController < ApplicationController
  def index
    @user = User.new
  end

  def new
  end

  def create
    user = User.find_by(email: params[:session][:email].downcase)
    if user && user.authenticate(params[:session][:password])
      log_in user
      params[:session][:remember_me] == '1' ? remember(user) : forget(user)
      redirect_to user
    else
      render :new
    end
  end

  def destroy
    log_out if logged_in?
    redirect_to root_url
  end
end