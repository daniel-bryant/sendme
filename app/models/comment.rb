class Comment < ActiveRecord::Base
  belongs_to :user
  belongs_to :post
  default_scope -> { order(created_at: :asc) }
  validates :content, presence: true
  validates :user_id, presence: true
  validates :post_id, presence: true
end
