class CreatePosts < ActiveRecord::Migration
  def change
    create_table :posts do |t|
      t.string :name, null: false
      t.text :content, null: false
      t.references :user, index: true, null: false

      t.timestamps null: false
    end
    add_foreign_key :posts, :users
    add_index :posts, :created_at
  end
end
