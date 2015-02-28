class User < ActiveRecord::Base
  attr_accessor :remember_token
  has_many :documents
  before_save { self.email = email.downcase }
  validates :name,  presence: true, length: {minimum: 5, maximum: 50}
  VALID_EMAIL_REGEX = /\A[\w+\-.]+@[a-z\d\-.]+\.[a-z]+\z/i
  validates :email, presence: true, length: { maximum: 255 },
                    format: { with: VALID_EMAIL_REGEX },
                    uniqueness: { case_sensitive: false }
  validates :title, length: { maximum: 255 }
  has_secure_password
  validates :password, length: { minimum: 6 }, allow_blank: true

  has_attached_file :avatar, styles: { medium: '200x200#', thumb: '75x75#' }, default_url: '/img/avatars/:style/missing.png'
  validates_attachment_content_type :avatar, content_type: /\Aimage\/.*\Z/

  def User.digest(string)
    BCrypt::Password.create(string)
  end

  def User.new_token
    SecureRandom.urlsafe_base64
  end

  def remember
    self.remember_token = User.new_token
    update_attribute(:remember_digest, User.digest(remember_token))
  end

  def authenticated?(remember_token)
    return false if remember_digest.nil?
    BCrypt::Password.new(remember_digest).is_password?(remember_token)
  end

  def forget
    update_attribute(:remember_digest, nil)
  end
end
