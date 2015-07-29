include ActionDispatch::TestProcess

FactoryGirl.define do
  factory :user do
    name "Factory User"
    sequence(:email) { |n| "user#{n}@example.com" }
    password "foobarfoo"
    password_confirmation "foobarfoo"
    activated true
    activated_at Time.zone.now
    avatar { fixture_file_upload(Rails.root.join('spec/fixtures/test_avatar.jpg'), 'image/jpg') }
  end

end
