require 'rails_helper'

RSpec.describe SessionsController, :type => :controller do
  describe 'Get index' do
    it 'assigns @user' do
      get :index
      expect(assigns(:user))
    end
  end

  describe 'POST create' do
    let(:user) { FactoryGirl.create(:user, activated: activated) }
    let(:activated) { true }
    let(:email) { user.email }
    let(:password) { 'foobarfoo' }

    before { post :create, session: {email: email, password: password} }

    context 'when user is not found with given email' do
      let(:email) { 'not_found@test.com' }

      it 'renders the new template' do
        expect(flash[:danger]).to eq('Invalid email/password combination')
        expect(response).to render_template('new')
      end
    end

    context 'when user is found but password is incorrect' do
      let(:password) { 'wrong password' }

      it 'renders the new template' do
        expect(flash[:danger]).to eq('Invalid email/password combination')
        expect(response).to render_template('new')
      end
    end

    context 'when user is found and password is correct' do
      context 'when user is not activated' do
        let(:activated) { false }

        it 'redirects to the root url' do
          expect(flash[:warning]).to eq('Account not activated. Check your email for the activation link.')
          expect(response).to redirect_to(root_url)
        end
      end

      context 'when user is activated' do
        it 'logs the user in' do
          expect(session[:user_id]).to eq(user.id)
        end

        it 'redirects to the user' do
          expect(response).to redirect_to(user)
        end

        context 'when remember_me param is not set' do
          before do
            controller.remember(user)
            post :create, session: {email: email, password: password}
          end

          it 'forgets the user' do
            expect(user.reload.remember_digest).to be_nil
          end

          it 'forgets the user_id cookie' do
            expect(cookies.permanent.signed[:user_id]).to be_nil
          end

          it 'forgets the remember_token cookie' do
            expect(cookies.permanent[:remember_token]).to be_nil
          end
        end

        context 'when remember_me param is set' do
          before do
            controller.forget(user)
            post :create, session: {email: email, password: password, remember_me: '1'}
          end

          it 'remembers the user' do
            expect(user.reload.remember_digest).not_to be_nil
          end

          it 'remembers the user_id cookie' do
            expect(cookies.permanent.signed[:user_id]).to eq(user.id)
          end

          it 'remembers the remember_token cookie' do
            expect(cookies.permanent[:remember_token]).not_to be_nil
          end
        end
      end
    end
  end

  describe 'DELETE destroy' do
    let(:user) { FactoryGirl.create(:user) }

    before do
      controller.log_in(user)
      controller.remember(user)
      delete :destroy
    end

    it 'logs the user out' do
      expect(session[:user_id]).to be_nil
    end

    it 'logs the user out' do
      expect(cookies.permanent.signed[:user_id]).to be_nil
    end

    it 'logs the user out' do
      expect(cookies.permanent[:remember_token]).to be_nil
    end

    it 'redirects to the root url' do
      expect(response).to redirect_to(root_url)
    end
  end

end
