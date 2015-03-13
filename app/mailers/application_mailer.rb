class ApplicationMailer < ActionMailer::Base
  default from: "donotreply@sendmeacopy.com"
  layout 'mailer'
end
