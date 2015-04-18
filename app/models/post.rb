class Post < ActiveRecord::Base
  belongs_to :user
  has_many :comments, dependent: :destroy
  default_scope -> { order(created_at: :desc) }
  validates :name, presence: true
  validates :content, presence: true
  validates :user_id, presence: true
end
