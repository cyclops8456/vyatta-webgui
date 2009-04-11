#!/usr/bin/perl
#
# Module: openapp-conf-ldap.pl
# 
# **** License ****
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License version 2 as
# published by the Free Software Foundation.
# 
# This program is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
# General Public License for more details.
# 
# This code was originally developed by Vyatta, Inc.
# Portions created by Vyatta are Copyright (C) 2007 Vyatta, Inc.
# All Rights Reserved.
# 
# Author: Michael Larson
# Date: March 2009
# Description: Script to archive backup and restore
# 
# **** End License ****
#

use lib "/opt/vyatta/share/perl5";
#use warnings;
use strict;
use POSIX;
use File::Copy;
use Getopt::Long;
use OpenApp::VMMgmt;
use OpenApp::LdapUser;

my $slap_file = "/etc/ldap/remote.conf";

my ($address,$r_pswd,$r_user,$rw_pswd,$rw_user,$local_db,$list);

my $OA_AUTH_USER = $ENV{OA_AUTH_USER};
my $auth_user = new OpenApp::LdapUser($OA_AUTH_USER);
my $auth_user_role = $auth_user->getRole();
if ($auth_user_role ne 'installer') {
  # not authorized
  exit 1;
}

sub set_ldap {
    # set up config session
    my $err = system("/opt/vyatta/sbin/vyatta-cfg-cmd-wrapper begin");
    if ($err != 0) {
	system("/opt/vyatta/sbin/vyatta-cfg-cmd-wrapper end");
	exit 1;
    }

    # apply config command
    $err = system("/opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set system open-app ldap address $address");
    if ($err != 0) {
	system("/opt/vyatta/sbin/vyatta-cfg-cmd-wrapper end");
	exit 1;
    }

    # apply config command
    $err = system("/opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set system open-app ldap r-password $r_pswd");
    if ($err != 0) {
	system("/opt/vyatta/sbin/vyatta-cfg-cmd-wrapper end");
	exit 1;
    }

    # apply config command
    $err = system("/opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set system open-app ldap r-username $r_user");
    if ($err != 0) {
	system("/opt/vyatta/sbin/vyatta-cfg-cmd-wrapper end");
	exit 1;
    }

    # apply config command
    $err = system("/opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set system open-app ldap rw-password $rw_pswd");
    if ($err != 0) {
	system("/opt/vyatta/sbin/vyatta-cfg-cmd-wrapper end");
	exit 1;
    }

    # apply config command
    $err = system("/opt/vyatta/sbin/vyatta-cfg-cmd-wrapper set system open-app ldap rw-username $rw_user");
    if ($err != 0) {
	system("/opt/vyatta/sbin/vyatta-cfg-cmd-wrapper end");
	exit 1;
    }

    # commit
    $err = system("/opt/vyatta/sbin/vyatta-cfg-cmd-wrapper commit"); 
    if ($err != 0) {
	system("/opt/vyatta/sbin/vyatta-cfg-cmd-wrapper end");
	exit 1;
    }
    $err = system("/opt/vyatta/sbin/vyatta-cfg-cmd-wrapper end");
   
}


##########################################################################
#
# change ldap target (true or false) for local
#
##########################################################################
sub set_ldap_target() {
#create include file
    #write the following to the end of the main /etc/ldap/slapd.conf file:

#need include include /etc/ldap/remote.conf in the main slapd.conf below the directory entry of the db



    #now create the file.
    if ($local_db eq 'true') {
	#should clear file that is included by slapd.conf
	`echo '' > $slap_file`;
    }
    else {
	#should write into file that is include by slapd.conf
	#will write into file the following:
	
	open(FILE, ">$slap_ file") or die "Can't open archive"; 
	print FILE "overlay translucent\n";
	print FILE "uri ldap://$address:389\n";
	close(FILE);
#haven't figured out password access yet....

    }
}

##########################################################################
#
# return ldap configuration values
#
##########################################################################
sub list_ldap() {
    print "VERBATIM_OUTPUT\n";
    my @out = `/opt/vyatta/sbin/vyatta-output-config.pl system open-app ldap`;
    
    my @address = split(" ",$out[0]);
    my @local_db = split(" ",$out[1]);
    my @r_password = split(" ",$out[2]);
    my @r_username = split(" ",$out[3]);
    my @rw_password = split(" ",$out[4]);
    my @rw_username = split(" ",$out[5]);

    print "<ldap>";
    print "<address>$address[1]</address>";
    print "<local>$local_db[1]</local>";
    print "<r-password>$r_password[1]</r-password>";
    print "<r-username>$r_username[1]</r-username>";
    print "<rw-password>$rw_password[1]</rw-password>";
    print "<rw-username>$rw_username[1]</rw-username>";
    print "</ldap>";
}

##########################################################################
#
# start of main
#
##########################################################################
sub usage() {
    print "       $0 --address=<address>\n";
    print "       $0 --r-pswd=<read-pswd>\n";
    print "       $0 --r-user=<read-user>\n";
    print "       $0 --rw-pswd=<readwrite-pswd>\n";
    print "       $0 --rw-user=<readwrite-user>\n";
    print "       $0 --list\n";
    exit 0;
}

#pull commands and call command
GetOptions(
    "address=s"               => \$address,
    "r-pswd=s"                => \$r_pswd,
    "r-user=s"                => \$r_user,
    "rw-pswd=s"               => \$rw_pswd,
    "rw-user=s"               => \$rw_user,
    "local=s"                 => \$local_db,
    "list:s"                  => \$list,
    ) or usage();

if (defined $address && defined $r_pswd && defined $r_user && defined $rw_pswd && defined $rw_user ) {
    set_ldap();
}
elsif (defined $local_db) {
    set_ldap_target();
}
else {
    list_ldap();
}
exit 0;
