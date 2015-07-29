require 'rails_helper'

RSpec.describe PasswordResetsController, :type => :controller do
  let(:user) { FactoryGirl.create(:user) }

  describe "GET new" do
    it "returns http success" do
      get :new
      expect(response).to have_http_status(:success)
    end
  end

  describe 'POST create' do
    context 'when user is found' do
      it 'creates a password reset digest for the user' do
        expect(user.reset_digest).to be_nil
        post :create, password_reset: {email: user.email}
        expect(user.reload.reset_sent_at).not_to be_nil
      end

      it 'set the reset_sent_at attributes for the user' do
        expect(user.reset_sent_at).to be_nil
        post :create, password_reset: {email: user.email}
        expect(user.reload.reset_digest).not_to be_nil
      end

      it 'sends the password reset email' do
        expect{ post :create, password_reset: {email: user.email} }.to change{ActionMailer::Base.deliveries.count}.by(1)
      end

      it 'redirects to the root url' do
        post :create, password_reset: {email: user.email}
        expect(flash[:info]).to eq('Email sent with password reset instructions')
        expect(response).to redirect_to root_url
      end
    end

    context 'when user is not found' do
      it 'renders the :new template' do
        post :create, password_reset: {email: 'not_found@test.com'}
        expect(flash.now[:danger]).to eq('Email address not found')
        expect(response).to render_template(:new)
      end
    end
  end

  describe "GET edit" do
    before { user.create_reset_digest }

    context 'when user is not found' do
      it 'redirects to the root url' do
        get :edit, id: user.reset_token, email: 'not_found@test.com'
        expect(response).to redirect_to root_url
      end
    end

    context 'when user found user is not activated' do
      it 'redirects to the root url' do
        user.update_attributes(activated: false)
        get :edit, id: user.reset_token, email: user.email
        expect(response).to redirect_to root_url
      end
    end

    context 'when the reset token is incorrect' do
      it 'redirects to the root url' do
        get :edit, id: '', email: user.email
        expect(response).to redirect_to root_url
      end
    end

    context 'when the reset token is expired' do
      it 'redirects to the root url' do
        user.update_attributes(reset_sent_at: 3.hours.ago)
        get :edit, id: user.reset_token, email: user.email
        expect(response).to redirect_to new_password_reset_url
      end
    end

    context 'when user is valid and reset is not expired' do
      it "returns http success" do
        get :edit, id: user.reset_token, email: user.email
        expect(response).to have_http_status(:success)
      end
    end
  end

  describe 'PUT update' do
    before { user.create_reset_digest }

    context 'when user is not found' do
      it 'redirects to the root url' do
        put :update, id: user.reset_token, email: 'not_found@test.com'
        expect(response).to redirect_to root_url
      end
    end

    context 'when user found user is not activated' do
      it 'redirects to the root url' do
        user.update_attributes(activated: false)
        put :update, id: user.reset_token, email: user.email
        expect(response).to redirect_to root_url
      end
    end

    context 'when the reset token is incorrect' do
      it 'redirects to the root url' do
        put :update, id: '', email: user.email
        expect(response).to redirect_to root_url
      end
    end

    context 'when the reset token is expired' do
      it 'redirects to the root url' do
        user.update_attributes(reset_sent_at: 3.hours.ago)
        put :update, id: user.reset_token, email: user.email
        expect(response).to redirect_to new_password_reset_url
      end
    end

    context 'when user is valid and reset is not expired' do
      let(:password_params) { {password: password, password_confirmation: password} }

      before { put :update, id: user.reset_token, email: user.email, user: password_params }

      context 'when password param is blank' do
        let(:password) { '' }

        it 'renders the :edit template' do
          expect(flash.now[:danger]).to eq("Password can't be blank")
          expect(response).to render_template(:edit)
        end
      end

      context 'when password params are valid' do
        let(:password) { 'newpassword123' }

        it 'logs the user in' do
          expect(session[:user_id]).to eq(user.id)
        end

        it 'redirects to the user' do
          expect(flash[:success]).to eq('Password has been reset.')
        end
      end

      context 'when password params is not valid' do
        let(:password) { 'a' }

        it 'renders the :edit template' do
          expect(response).to render_template(:edit)
        end
      end
    end
  end

end
