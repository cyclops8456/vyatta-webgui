#ifndef __COMMAND_HH__
#define __COMMAND_HH__

#include "systembase.hh"
#include "processor.hh"

class Command : public SystemBase
{
public:
  Command();
  ~Command();

  void
  execute_command();


private:
  bool
  validate_session(unsigned long id);

};
#endif //__COMMAND_HH__
