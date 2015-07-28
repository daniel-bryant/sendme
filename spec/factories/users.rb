FactoryGirl.define do
  factory :user do
    name "Factory User"
    sequence(:email) { |n| "user#{n}@example.com" }
    password "foobarfoo"
    password_confirmation "foobarfoo"
    activated true
    activated_at Time.zone.now
  end

end
