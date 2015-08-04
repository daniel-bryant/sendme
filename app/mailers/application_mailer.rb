class ApplicationMailer < ActionMailer::Base
  default from: "SendMe <admin@sendmeacopy.com>"
  layout 'mailer'
end
