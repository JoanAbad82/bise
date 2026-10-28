# bend/proofs/dns.bend: the proofs of bend/laws/dns.bend. Each holds by
# unfolding the definitions involved; the checker verifies the equalities.
import Base
import ../laws/dns.bend as Laws

def Laws.found_keeps_ipv4_in_order():
  {==}

def Laws.found_ipv6_only_says_so():
  {==}

def Laws.found_no_address():
  {==}

def Laws.found_no_answer():
  {==}

def Laws.found_other_failure():
  {==}

def Laws.miss_line_no_address():
  {==}

def Laws.miss_line_no_answer():
  {==}

def Laws.miss_line_ipv6_only_names_no_network():
  {==}

def Laws.first_address_down_tries_the_next():
  {==}

def Laws.no_address_connects_keeps_the_last_error():
  {==}

def Laws.handshake_failure_stops():
  {==}
