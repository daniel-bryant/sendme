require 'rails_helper'

RSpec.describe ActivationsController, :type => :controller do
  let(:user) { FactoryGirl.create(:user, activated: false, activated_at: nil) }

  describe 'GET new' do
    it 'returns http success' do
      get :new
      expect(response).to have_http_status(:success)
    end
  end

  describe 'POST create' do
    context 'when user is found' do
      context 'when user is not already activated' do
        it 'sends the activation email' do
          expect{ post :create, activation: {email: user.email} }.to change{ActionMailer::Base.deliveries.count}.by(1)
        end
      end

      context 'when user is already activated' do
        before { user.activate }

        it 'renders the :new template' do
          post :create, activation: {email: user.email}
          expect(flash.now[:danger]).to eq('Email address not found or already activated')
          expect(response).to render_template(:new)
        end
      end
    end

    context 'when user is not found' do
      it 'renders the :new template' do
        post :create, activation: {email: 'not_found@test.com'}
        expect(flash.now[:danger]).to eq('Email address not found or already activated')
        expect(response).to render_template(:new)
      end
    end
  end

  describe 'GET edit' do
    let(:email) { user.email }
    let(:id) { user.activation_token }

    specify { expect(user).not_to be_activated }

    context 'when the user is already activated' do
      before do
        user.activate
        get :edit, id: id, email: email
      end

      it 'redirects to the root url' do
        expect(flash[:danger]).to eq('Invalid activation link')
        expect(response).to redirect_to root_url
      end
    end

    context 'when the user is not activated' do
      before { get :edit, id: id, email: email }

      context 'when user with given email is not found' do
        let(:email) { 'not_found@test.com' }

        it 'redirects to the root url' do
          expect(flash[:danger]).to eq('Invalid activation link')
          expect(response).to redirect_to root_url
        end
      end

      context 'when the activation token is invalid' do
        let(:id) { 'wrongtoken' }

        it 'redirects to the root url' do
          expect(flash[:danger]).to eq('Invalid activation link')
          expect(response).to redirect_to root_url
        end
      end

      context 'when all params are valid' do
        it 'activates the user' do
          expect(user.reload).to be_activated
        end

        it 'logs the user in' do
          expect(session[:user_id]).to eq(user.id)
        end

        it 'redirects to the user' do
          expect(flash[:success]).to eq('Account activated!')
          expect(response).to redirect_to(user)
        end
      end
    end

  end

end
