FactoryGirl.define do
  factory :user do
    name "Factory User"
    email "factory_user@test.com"
    password "foobarfoo"
    password_confirmation "foobarfoo"
    activated true
    activated_at Time.zone.now
  end

end
