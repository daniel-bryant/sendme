require 'rails_helper'

RSpec.describe DocumentsController, :type => :controller do
  let(:user) { FactoryGirl.create(:user) }
  let!(:document) { FactoryGirl.create(:document, name: 'Spec document', body: '') }

  describe 'GET show' do
    it 'assigns @document' do
      get :show, id: document.id
      expect(assigns(:document)).to eq(document)
    end
  end

  describe 'POST create' do
    context 'when not logged in' do
      it 'does not create a new document' do
        expect{ post :create }.to change{Document.count}.by(0)
      end

      it 'redirects to the login url' do
        post :create
        expect(response).to redirect_to login_url
      end
    end

    context 'when logged in' do
      before { controller.log_in user }

      it 'create a new document' do
        expect{ post :create }.to change{Document.count}.by(1)
      end

      it 'redirects to the edit document path' do
        post :create
        expect(response).to be_redirect
      end
    end
  end

  describe 'GET edit' do
    context 'when not logged in' do
      it 'redirects to the login url' do
        get :edit, id: document.id
        expect(response).to redirect_to login_url
      end
    end

    context 'when logged in' do
      context 'when the document does not belong to the user' do
        before { controller.log_in user }

        it 'redirects to the root url' do
          get :edit, id: document.id
          expect(response).to redirect_to root_url
        end
      end
    end
  end

  describe 'PUT update' do
    let(:new_name) { 'New document name' }
    let(:invalid_name) { 'a' }

    context 'when not logged in' do
      before { put :update, id: document.id, document: {name: new_name} }

      it 'redirects to the login url' do
        expect(response).to redirect_to login_url
      end

      it 'does not update the document' do
        expect(document.reload.name).not_to eq(new_name)
      end
    end

    context 'when logged in' do
      context 'when the document does not belong to the user' do
        before { controller.log_in user }

        context 'when params are valid' do
          before { put :update, id: document.id, document: {name: new_name} }

          it 'redirects to the root url' do
            expect(response).to redirect_to root_url
          end

          it 'does not update the document' do
            expect(document.reload.name).not_to eq(new_name)
          end
        end
      end

      context 'when the document belongs to the user' do
        before { controller.log_in document.user }

        context 'when params are valid' do
          before { put :update, id: document.id, document: {name: new_name} }

          it 'redirects to the edit document path' do
            expect(flash[:success]).to eq('Document name updated')
            expect(response).to redirect_to edit_document_path document
          end

          it 'updates the document' do
            expect(document.reload.name).to eq(new_name)
          end
        end

        context 'when params are not valid' do
          before { put :update, id: document.id, document: {name: invalid_name} }

          it 'redirects to the edit document path' do
            expect(flash[:danger]).to be_present
            expect(response).to redirect_to edit_document_path document
          end

          it 'does not update the document' do
            expect(document.reload.name).not_to eq(invalid_name)
          end
        end

        describe 'json response type' do
          let(:new_body) { '<div></div>' }

          context 'when params are valid' do
            before { put :update, id: document.id, document: {body: new_body}, format: :json }

            it 'responds with http status :no_content' do
              expect(response).to have_http_status(:no_content)
            end

            it 'updates the document' do
              expect(document.reload.body).to eq(new_body)
            end
          end

          context 'when params are not valid' do
            before { put :update, id: document.id, document: {name: invalid_name}, format: :json }

            it 'responds with status :unprocessable_entity' do
              expect(response).to have_http_status(:unprocessable_entity)
            end

            it 'does not update the document' do
              expect(document.reload.name).not_to eq(invalid_name)
            end
          end
        end
      end
    end
  end

  describe 'DELETE destroy' do
    context 'when not logged in' do
      it 'redirects to the login url' do
        delete :destroy, id: document.id
        expect(response).to redirect_to login_url
      end

      it 'does not destroy the document' do
        expect{delete :destroy, id: document.id}.to change{Document.count}.by(0)
      end
    end

    context 'when logged in' do
      context 'when the document does not belong to the user' do
        before { controller.log_in user }

        it 'redirects to the root url' do
          delete :destroy, id: document.id
          expect(response).to redirect_to root_url
        end

        it 'does not destroy the document' do
          expect{delete :destroy, id: document.id}.to change{Document.count}.by(0)
        end
      end

      context 'when the document belongs to the user' do
        before { controller.log_in document.user }

        it 'destroys the document' do
          expect{delete :destroy, id: document.id}.to change{Document.count}.by(-1)
        end

        it 'redirects to the user' do
          delete :destroy, id: document.id
          expect(response).to redirect_to document.user
        end
      end
    end
  end

end
