require 'rails_helper'

RSpec.describe ActivationsController, :type => :controller do
  describe 'GET edit' do
    let(:user) { FactoryGirl.create(:user, activated: false, activated_at: nil) }
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
