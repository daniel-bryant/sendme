require "rails_helper"

RSpec.describe UserMailer, :type => :mailer do
  let(:user) { FactoryGirl.create(:user) }

  describe "account_activation" do
    let(:mail) { UserMailer.account_activation(user) }

    it "renders the headers" do
      expect(mail.subject).to eq("Account activation")
      expect(mail.to).to eq([user.email])
      expect(mail.from).to eq(["admin@sendmeacopy.com"])
    end

    it "renders the body" do
      activation_url = edit_activation_url(user.activation_token, email: user.email)
      expect(mail.body.encoded).to include(activation_url)
    end
  end

  describe "password_reset" do
    let(:mail) { UserMailer.password_reset(user) }
    before { user.create_reset_digest }

    it "renders the headers" do
      expect(mail.subject).to eq("Password reset")
      expect(mail.to).to eq([user.email])
      expect(mail.from).to eq(["admin@sendmeacopy.com"])
    end

    it "renders the body" do
      password_reset_url = edit_password_reset_url(user.reset_token, email: user.email)
      expect(mail.body.encoded).to include(password_reset_url)
    end
  end

end
