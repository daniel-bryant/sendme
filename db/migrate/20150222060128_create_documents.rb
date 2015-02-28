class CreateDocuments < ActiveRecord::Migration
  def change
    create_table :documents do |t|
      t.string :name, null: false
      t.text :body, null: false
      t.belongs_to :user, null: false

      t.timestamps null: false
    end
  end
end
