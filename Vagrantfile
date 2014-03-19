# -*- mode: ruby -*-
# vi: set ft=ruby :


# Snippet of shell commands used to install a current version of node.js
# using apt-get. Extra work is needed due to the official apt repo being
# on v0.6.x.
$installNode = <<EOL
apt-get update
apt-get install --assume-yes python-software-properties python g++ make
add-apt-repository --yes ppa:chris-lea/node.js
apt-get update
apt-get install --assume-yes nodejs
EOL


$startBullhorn = <<EOL
mkdir -p /var/log/jetway/bullhorn
cd /opt/jetway/bullhorn
npm install

forever start -l /var/log/jetway/bullhorn/forever.log -o /var/log/jetway/bullhorn/stdout.log \
              -e /var/log/jetway/bullhorn/stderr.log --append --pidFile bullhorn.pid app.js
EOL


# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "precise64"
  config.vm.box_url = "http://files.vagrantup.com/precise64.box"

  config.vm.network "forwarded_port", guest: 3000, host: 3001
  config.vm.synced_folder ".", "/opt/jetway/bullhorn"

  config.vm.provision :shell, :inline => $installNode
  config.vm.provision :shell, :inline => "npm install -g forever"
  config.vm.provision :shell, :inline => $startBullhorn

end