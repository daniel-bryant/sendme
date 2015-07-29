require 'rails_helper'

RSpec.describe UsersController, :type => :controller do
  let(:user) { FactoryGirl.create(:user, name: 'Spec User') }
  let(:another_user) { FactoryGirl.create(:user) }

  describe 'GET show' do
    context 'when user is not logged in' do
      it 'redirects to the login url' do
        get :show, id: user.id
        expect(response).to redirect_to login_url
      end
    end

    context 'when logged in' do
      context 'when current user is not found user' do
        before { controller.log_in another_user }

        it 'redirects to the root url' do
          get :show, id: user.id
          expect(response).to redirect_to root_url
        end
      end
    end
  end

  describe 'GET new' do
    it 'assigns @user' do
      get :new
      expect(assigns(:user))
    end
  end

  describe 'POST create' do
    let(:user_params) { {user: {name: 'spec user', email: 'specuser@test.com',
      password: 'foobarfoo', password_confirmation: 'foobarfoo'}} }
    let(:bad_params) { {user: {name: 'a'}} }

    it 'assigns @user' do
      post :create, user_params
      expect(assigns(:user))
    end

    context 'when params are valid' do
      it 'creates a new user' do
        expect{post :create, user_params}.to change{User.count}.by(1)
      end

      it 'sends an activation email' do
        expect{post :create, user_params}.to change{ActionMailer::Base.deliveries.count}.by(1)
      end
    end

    context 'when params are invalid' do
      it 'does not create a new user' do
        expect{post :create, bad_params}.to change{User.count}.by(0)
      end

      it 'renders the :new template' do
        post :create, bad_params
        expect(response).to render_template(:new)
      end
    end
  end

  describe 'GET edit' do
    context 'when user is not logged in' do
      it 'redirects to the login url' do
        get :edit, id: user.id
        expect(response).to redirect_to login_url
      end
    end

    context 'when logged in' do
      context 'when current user is not found user' do
        before { controller.log_in another_user }

        it 'redirects to the root url' do
          get :edit, id: user.id
          expect(response).to redirect_to root_url
        end
      end
    end
  end

  describe 'PUT update' do
    let(:new_name) { 'New User Name' }

    context 'when user is not logged in' do
      it 'redirects to the login url' do
        put :update, id: user.id, user: {name: new_name}
        expect(response).to redirect_to login_url
      end

      it 'does not update the user' do
        put :update, id: user.id, user: {name: new_name}
        expect(user.reload.name).not_to eq(new_name)
      end
    end

    context 'when logged in' do
      context 'when current user is not found user' do
        before { controller.log_in another_user }

        it 'redirects to the root url' do
          put :update, id: user.id, user: {name: new_name}
          expect(response).to redirect_to root_url
        end

        it 'does not update the user' do
          put :update, id: user.id, user: {name: new_name}
          expect(user.reload.name).not_to eq(new_name)
        end
      end

      context 'when the current user is the found user' do
        before { controller.log_in user }

        context 'when params are valid' do
          it 'updates the user' do
            put :update, id: user.id, user: {name: new_name}
            expect(user.reload.name).to eq(new_name)
          end

          it 'redirects to the user' do
            put :update, id: user.id, user: {name: new_name}
            expect(response).to redirect_to user
          end
        end

        context 'when params are invalid' do
          let(:invalid_name) { 'a' }

          it 'does not update the user' do
            put :update, id: user.id, user: {name: invalid_name}
            expect(user.reload.name).not_to eq(invalid_name)
          end

          it 'renders the :edit template' do
            put :update, id: user.id, user: {name: invalid_name}
            expect(response).to render_template(:edit)
          end
        end
      end
    end
  end

  describe 'DELETE avatar' do
    context 'when user is not logged in' do
      it 'redirects to the login url' do
        delete :avatar, id: user.id
        expect(response).to redirect_to login_url
      end
    end

    context 'when logged in' do
      context 'when current user is not found user' do
        before { controller.log_in another_user }

        it 'redirects to the root url' do
          delete :avatar, id: user.id
          expect(response).to redirect_to root_url
        end
      end

      context 'when the current user is the found user' do
        before { controller.log_in user }

        it 'redirects to the edit user path' do
          delete :avatar, id: user.id
          expect(response).to redirect_to edit_user_path user
        end
      end
    end
  end

end
