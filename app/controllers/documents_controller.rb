class DocumentsController < ApplicationController
  before_action :logged_in_user, only: [:edit, :update, :destroy, :create]
  before_action :correct_user,   only: [:edit, :update, :destroy]

  def show
    @document = Document.find(params[:id])
    respond_to do |format|
      format.html
      format.pdf do
        render pdf: @document.name.parameterize.underscore,
          layout: 'pdf.html',
          page_size: 'Letter',
          disposition: 'attachment',
          margin: {top: 0, bottom: 0, left: 0, right: 0},
          disable_javascript: false
      end
    end
  end

  def create
    document = current_user.documents.create(name: "Document #{current_user.documents.count + 1}", body: "")
    redirect_to edit_document_path document
  end

  def edit
  end

  def update
    respond_to do |format|
      if @document.update_attributes(document_params)
        format.html do
          flash[:success] = 'Document name updated'
          redirect_to edit_document_path(@document)
        end
        format.json { head :no_content }
      else
        format.html do
          flash[:danger] = @document.errors.to_a.join(". ")
          redirect_to edit_document_path(@document)
        end
        format.json { render json: @document.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @document.destroy
    flash[:success] = "Document deleted"
    redirect_to current_user
  end

  private
    def document_params
      params.require(:document).permit(:name, :body)
    end

    def correct_user
      @document = Document.find(params[:id])
      redirect_to(root_url) unless current_user?(@document.user)
    end
end
