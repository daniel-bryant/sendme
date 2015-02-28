class Document < ActiveRecord::Base
  belongs_to :user
  validates_presence_of :user
  validates :name, presence: true, length: {minimum: 5, maximum: 50}
  validates :body, length: {minimum: 0, allow_nil: false, message: "can't be nil"}
end
