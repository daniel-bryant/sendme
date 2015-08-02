class ApplicationMailer < ActionMailer::Base
  default from: "SendMe <donotreply@sendmeacopy.com>"
  layout 'mailer'
end
